# Add Course Deletion to Admin Course Management

## Goal
Add a "delete course" action to the admin **Course Management** page (`apps/web/src/routes/_admin.admin.academy/courses.tsx`), following the exact pattern already used for users/reviews/categories.

## Context & Constraints
- **Page:** `apps/web/src/routes/_admin.admin.academy/courses.tsx` — table with per-row Actions (Lessons link, Publish/Unpublish button).
- **Server:** `apps/web/src/server/admin.ts` — has `ensureAdmin()` guard, `createCourseFn`, `toggleCoursePublishedFn`. Existing `deleteUserFn` (lines 281-297) demonstrates the transaction-dependency pattern to copy.
- **Schema:** `apps/web/prisma/schema.prisma` — `Course` has NO `onDelete: Cascade`. A course is referenced (with required FK columns, DB default = restrict) by:
  - `Lesson.courseId` → and `LessonProgress.lessonId` → `Lesson`
  - `Enrollment.courseId`
  - `Review.courseId`
  - `Payment.courseId` → and `Refund.paymentId` (required, non-null) → `Payment`
- Because FKs are restricted (no cascade), deleting a course directly fails. Dependent rows must be deleted first inside a transaction.

## Changes

### 1. Server: add `deleteCourseFn` in `apps/web/src/server/admin.ts`
Add after `toggleCoursePublishedFn` (around line 172), matching existing style (uses `createServerFn`, `ensureAdmin()`, zod validator, `prisma.$transaction`).

```ts
export const deleteCourseFn = createServerFn({ method: "POST" })
  .validator(z.object({ courseId: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    await prisma.$transaction(async (tx) => {
      // Progress is keyed to lessons of this course
      await tx.lessonProgress.deleteMany({
        where: { lesson: { courseId: data.courseId } },
      });
      await tx.lesson.deleteMany({ where: { courseId: data.courseId } });

      // Payments referencing the course, plus their refunds
      const payments = await tx.payment.findMany({
        where: { courseId: data.courseId },
        select: { id: true },
      });
      const paymentIds = payments.map((p) => p.id);
      await tx.refund.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await tx.payment.deleteMany({ where: { courseId: data.courseId } });

      await tx.enrollment.deleteMany({ where: { courseId: data.courseId } });
      await tx.review.deleteMany({ where: { courseId: data.courseId } });

      await tx.course.delete({ where: { id: data.courseId } });
    });

    return { success: true };
  });
```

Notes:
- Order matters: delete `Refund` before `Payment` (Refund.paymentId is a required FK).
- Delete `LessonProgress` before `Lesson`.
- Optional (skip unless thumbnail is actually stored for these courses): delete S3 thumbnail via `apps/web/src/server/s3.ts`. Leave out of scope unless the user wants it.

### 2. Frontend: add delete button in `courses.tsx`
- Import `deleteCourseFn` from `@/server/admin` and `Trash2` from `lucide-react` (line 5: `import { Plus, Eye, EyeOff, Trash2 } from "lucide-react";`).
- Add a handler mirroring `users.tsx` `handleDelete`:
```ts
const handleDeleteCourse = async (courseId: string) => {
  if (!confirm("Delete this course? This removes its lessons, enrollments, payments, and reviews."))
    return;
  try {
    await deleteCourseFn({ data: { courseId } });
    router.invalidate();
  } catch (err) {
    alert(err instanceof Error ? err.message : "Failed to delete course");
  }
};
```
- In the row Actions `<div>` (lines 201-218), add a trash icon button before/after the Publish button:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleDeleteCourse(course.id)}
  className="text-red-500 hover:bg-red-500/10"
  title="Delete course"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

## Validation
1. `npm run typecheck` (or the project's lint/typecheck script from `package.json`) to confirm no type errors.
2. Manual: open `/admin/admin/academy/courses`, click trash on a course → confirm dialog appears → confirm → row disappears and table reloads via `router.invalidate()`.
3. Verify dependent records are gone: query DB for lessons/progress/enrollments/reviews/payments/refunds linked to the deleted course id (expect 0).
4. Verify a course with NO dependents also deletes cleanly.
5. Non-admin access returns "Unauthorized: Admin access required" (guarded by `ensureAdmin`).

## Risks / Out of Scope
- Hard delete is irreversible; the `confirm()` dialog is the only guard. This matches existing app behavior for users/reviews.
- Deleting a course with paid enrollments/payments deletes those financial records. This is consistent with the existing `deleteUserFn` behavior but should be flagged in the confirm text (done above).
- No S3 thumbnail cleanup (out of scope unless requested).
