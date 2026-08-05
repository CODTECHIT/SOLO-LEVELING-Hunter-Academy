import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";

// Middleware to ensure user is admin
async function ensureAdmin() {
  const user = await getCurrentUserFn();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

export const promoteToAdminFn = createServerFn({ method: "POST" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) throw new Error("Must be logged in to promote");

  // Self-promotion is a dev/testing shortcut only. If it shipped to
  // production, any registered user could escalate to ADMIN and then reach
  // every admin handler (stats, course CRUD, refunds, etc.).
  if (process.env.NODE_ENV === "production") {
    throw new Error("Self-promotion is disabled in production");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  return { success: true };
});

export const getAdminStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();
  const totalEnrollments = await prisma.enrollment.count();

  // Assuming fixed price 3999 per enrollment for mock revenue
  const totalRevenue = totalEnrollments * 3999;

  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue,
  };
});

export const getAdminCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      _count: {
        select: { enrollments: true, lessons: true },
      },
    },
  });

  const categories = await prisma.category.findMany();

  return { courses, categories };
});

export const getAdminCourseDetailsFn = createServerFn({ method: "GET" })
  .validator((d: { courseId: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) throw new Error("Course not found");
    return course;
  });

export const createLessonFn = createServerFn({ method: "POST" })
  .validator((d: { courseId: string; title: string; description: string; videoUrl: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    // Find highest order to append to the end
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: "desc" },
    });
    const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

    const lesson = await prisma.lesson.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        order: nextOrder,
      },
    });
    return lesson;
  });

export const deleteLessonFn = createServerFn({ method: "POST" })
  .validator((d: { lessonId: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    await prisma.lesson.delete({
      where: { id: data.lessonId },
    });
    return { success: true };
  });

export const createCourseFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1),
      description: z.string(),
      price: z.number().min(0),
      categoryId: z.string(),
      type: z.enum(["FULL", "MODULE"]).default("FULL"),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

    const newCourse = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        type: data.type,
        published: false,
      },
    });

    return newCourse;
  });

export const toggleCoursePublishedFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      courseId: z.string(),
      published: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const updatedCourse = await prisma.course.update({
      where: { id: data.courseId },
      data: { published: data.published },
    });

    return updatedCourse;
  });

// ---------- Categories ----------

export const getAdminCategoriesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { courses: true } },
    },
  });

  return { categories };
});

export const createCategoryFn = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const slug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    const category = await prisma.category.create({ data: { name: data.name, slug } });
    return category;
  });

export const updateCategoryFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), name: z.string().min(1) }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const slug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

    const category = await prisma.category.update({
      where: { id: data.id },
      data: { name: data.name, slug },
    });
    return category;
  });

export const deleteCategoryFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const courseCount = await prisma.course.count({ where: { categoryId: data.id } });
    if (courseCount > 0) {
      throw new Error("Cannot delete category with existing courses");
    }

    await prisma.category.delete({ where: { id: data.id } });
    return { success: true };
  });

// ---------- Users ----------

export const getAdminUsersFn = createServerFn({ method: "GET" })
  .validator(
    z.object({ role: z.enum(["ALL", "STUDENT", "SUB_ADMIN", "ADMIN"]).default("ALL") }).optional(),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const role = data?.role && data.role !== "ALL" ? data.role : undefined;

    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    });

    const total = await prisma.user.count();
    const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
    const staffCount = await prisma.user.count({ where: { role: { in: ["ADMIN", "SUB_ADMIN"] } } });

    return { users, total, studentCount, staffCount };
  });

export const updateUserRoleFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), role: z.enum(["ADMIN", "SUB_ADMIN", "STUDENT"]) }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    await prisma.user.update({ where: { id: data.id }, data: { role: data.role } });
    return { success: true };
  });

export const deleteUserFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const admin = await ensureAdmin();
    if (admin.id === data.id) throw new Error("You cannot delete your own account");

    // Delete dependent records safely
    await prisma.$transaction(async (tx) => {
      await tx.lessonProgress.deleteMany({ where: { userId: data.id } });
      await tx.enrollment.deleteMany({ where: { userId: data.id } });
      await tx.refund.deleteMany({ where: { userId: data.id } });
      await tx.review.deleteMany({ where: { userId: data.id } });
      await tx.payment.deleteMany({ where: { userId: data.id } });
      await tx.user.delete({ where: { id: data.id } });
    });
    return { success: true };
  });

// ---------- Roles ----------

export const getAdminRolesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const builtIn = (
    await prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    })
  ).map((g) => ({ name: g.role, userCount: g._count._all }));

  const customRoles = await prisma.customRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return { builtIn, customRoles };
});

export const createRoleFn = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().min(1), permissions: z.any() }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const role = await prisma.customRole.create({
      data: {
        name: data.name,
        permissions: data.permissions ?? {},
      },
    });
    return role;
  });

export const updateRolePermissionsFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), permissions: z.any() }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const role = await prisma.customRole.update({
      where: { id: data.id },
      data: { permissions: data.permissions },
    });
    return role;
  });

export const deleteRoleFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    // CustomRole has no cascade in schema; users get dereferenced instead of deleted.
    await prisma.$transaction([
      prisma.user.updateMany({ where: { customRoleId: data.id }, data: { customRoleId: null } }),
      prisma.customRole.delete({ where: { id: data.id } }),
    ]);
    return { success: true };
  });

// ---------- Payments / Financials ----------

export const getAdminPaymentsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;

  return { payments, totalRevenue, paidCount, pendingCount, failedCount };
});

// ---------- Refunds ----------

export const getAdminRefundsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { refunds };
});

export const updateRefundStatusFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const refund = await prisma.refund.update({
      where: { id: data.id },
      data: { status: data.status },
    });
    return refund;
  });

// ---------- Reviews ----------

export const getAdminReviewsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return { reviews, avgRating };
});

export const deleteReviewFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    await prisma.review.delete({ where: { id: data.id } });
    return { success: true };
  });
