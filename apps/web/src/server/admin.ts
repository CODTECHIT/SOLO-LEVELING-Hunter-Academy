import { createServerFn } from "@tanstack/react-start";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";
import { ensurePermission, ensureAdmin } from "./permissions";
export { ensurePermission, ensureAdmin };



// Turns raw Prisma/DB errors into a short, human-friendly message instead of
// leaking the full query engine dump to the admin UI.
function throwFriendlyError(err: unknown, fallback: string): never {
  const isPrismaError =
    err instanceof Error &&
    /(Invalid `prisma\.|Unknown argument|PrismaClient(Validation|KnownRequest)Error)/.test(
      err.message,
    );
  if (isPrismaError) throw new Error(fallback);
  throw err;
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
  await ensurePermission("stats");

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
  await ensurePermission("courses");

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

export const updateLessonFn = createServerFn({ method: "POST" })
  .validator((d: { lessonId: string; title: string; description?: string; videoUrl: string }) => d)
  .handler(async ({ data }) => {
    await ensureAdmin();

    try {
      const updated = await prisma.lesson.update({
        where: { id: data.lessonId },
        data: {
          title: data.title,
          description: data.description?.trim() ? data.description.trim() : null,
          videoUrl: data.videoUrl,
        },
      });
      return updated;
    } catch (err) {
      throwFriendlyError(err, "Failed to update lesson. Please try again.");
    }
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
      thumbnail: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    try {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

      const newCourse = await prisma.course.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          price: data.price,
          categoryId: data.categoryId,
          type: data.type,
          thumbnail: data.thumbnail?.trim() ? data.thumbnail.trim() : null,
          published: false,
        },
      });

      return newCourse;
    } catch (err) {
      throwFriendlyError(err, "Failed to create course. Please try again.");
    }
  });

export const updateCourseFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      courseId: z.string(),
      title: z.string().min(1),
      description: z.string(),
      price: z.number().min(0),
      categoryId: z.string(),
      type: z.enum(["FULL", "MODULE"]),
      thumbnail: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    try {
      const updatedCourse = await prisma.course.update({
        where: { id: data.courseId },
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          categoryId: data.categoryId,
          type: data.type,
          thumbnail: data.thumbnail?.trim() ? data.thumbnail.trim() : null,
        },
      });

      return updatedCourse;
    } catch (err) {
      throwFriendlyError(err, "Failed to update course. Please try again.");
    }
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
      await tx.faqItem.deleteMany({ where: { courseId: data.courseId } });

      await tx.course.delete({ where: { id: data.courseId } });
    });

    return { success: true };
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
  .validator(z.object({ name: z.string().trim().min(1), image: z.string().optional() }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    try {
      const existing = await prisma.category.findFirst({
        where: { name: { equals: data.name, mode: "insensitive" } },
      });
      if (existing) throw new Error("Category already exists.");

      const slug =
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now();

      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug,
          image: data.image?.trim() ? data.image.trim() : null,
        },
      });
      return category;
    } catch (err) {
      throwFriendlyError(err, "Failed to create category. Please try again.");
    }
  });

export const updateCategoryFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ id: z.string(), name: z.string().trim().min(1), image: z.string().optional() }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    try {
      const existing = await prisma.category.findFirst({
        where: { name: { equals: data.name, mode: "insensitive" }, id: { not: data.id } },
      });
      if (existing) throw new Error("Category already exists.");

      const slug =
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now();

      const category = await prisma.category.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug,
          image: data.image?.trim() ? data.image.trim() : null,
        },
      });
      return category;
    } catch (err) {
      throwFriendlyError(err, "Failed to update category. Please try again.");
    }
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
    z.object({ role: z.enum(["ALL", "STUDENT", "TECHNICAL_TEAM", "MANAGER", "ADMIN"]).default("ALL") }).optional(),
  )
  .handler(async ({ data }) => {
    await ensurePermission("users");

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
        customRoleId: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
        enrollments: {
          select: {
            course: {
              select: { category: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    const mappedUsers = users.map(({ enrollments, ...user }) => ({
      ...user,
      categories: Array.from(
        new Map(enrollments.map((e) => [e.course.category.id, e.course.category])).values(),
      ),
    }));

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    const total = await prisma.user.count();
    const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
    const staffCount = await prisma.user.count({ where: { role: { in: ["ADMIN", "MANAGER", "TECHNICAL_TEAM"] } } });

    return { users: mappedUsers, categories, total, studentCount, staffCount };
  });

export const updateUserRoleFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), role: z.enum(["ADMIN", "MANAGER", "TECHNICAL_TEAM", "STUDENT"]) }))
  .handler(async ({ data }) => {
    await ensurePermission("users");

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

// ---------- Students ----------

export const getAdminStudentsFn = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        search: z.string().trim().optional(),
        categoryId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const search = data?.search?.trim();
    const categoryId = data?.categoryId;
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 10;

    // Students only — staff (ADMIN/SUB_ADMIN) are managed on the Staff page.
    // One row per enrollment, so each course a student has taken gets its own
    // Enrolled/Expiry/Amount/Status values.
    const where: Prisma.EnrollmentWhereInput = { user: { role: "STUDENT" } };
    if (search) {
      where.user = {
        role: "STUDENT",
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }
    if (categoryId) {
      where.course = { categoryId };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      enrollments,
      categories,
      totalStudents,
      activeStudents,
      newThisMonth,
      totalEnrollments,
    ] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        orderBy: { enrolledAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          course: {
            select: {
              id: true,
              title: true,
              categoryId: true,
              category: { select: { name: true } },
              lessons: { select: { id: true } },
            },
          },
        },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({
        where: { role: "STUDENT", progress: { some: { progressSeconds: { gt: 0 } } } },
      }),
      prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: startOfMonth } } }),
      prisma.enrollment.count({ where: { user: { role: "STUDENT" } } }),
    ]);

    // Which student+course pairs have actually started watching (Active vs Inactive),
    // and what they paid (Payment rows keyed by user+course).
    const userIds = [...new Set(enrollments.map((e) => e.userId))];
    const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
    const startedKeys = new Set<string>();
    const paymentMap = new Map<string, { amount: number; currency: string; paid: boolean }>();
    if (userIds.length > 0 && courseIds.length > 0) {
      const [watched, payments] = await Promise.all([
        prisma.lessonProgress.findMany({
          where: { userId: { in: userIds }, lesson: { courseId: { in: courseIds } } },
          select: { userId: true, progressSeconds: true, lesson: { select: { courseId: true } } },
        }),
        prisma.payment.findMany({
          where: { userId: { in: userIds }, courseId: { in: courseIds } },
          select: { userId: true, courseId: true, amount: true, currency: true, status: true },
        }),
      ]);
      for (const p of watched) {
        if (p.progressSeconds > 0) startedKeys.add(`${p.userId}:${p.lesson.courseId}`);
      }
      for (const p of payments) {
        const key = `${p.userId}:${p.courseId}`;
        const existing = paymentMap.get(key);
        if (p.status === "PAID" || !existing || !existing.paid) {
          paymentMap.set(key, {
            amount: p.amount,
            currency: p.currency,
            paid: p.status === "PAID",
          });
        }
      }
    }

    const enrollmentsData = enrollments.map((enrollment) => {
      const { user, course } = enrollment;
      let status: "Active" | "Inactive" | "Expired" | "Lifetime";
      if (enrollment.expiresAt && enrollment.expiresAt <= now) {
        status = "Expired";
      } else if (!enrollment.expiresAt) {
        status = "Lifetime";
      } else if (startedKeys.has(`${user.id}:${course.id}`)) {
        status = "Active";
      } else {
        status = "Inactive";
      }
      const payment = paymentMap.get(`${user.id}:${course.id}`);
      return {
        id: enrollment.id,
        studentId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        course: { id: course.id, title: course.title, category: course.category.name },
        enrolledAt: enrollment.enrolledAt,
        expiresAt: enrollment.expiresAt,
        amount: payment?.paid ? payment.amount : null,
        currency: payment?.paid ? payment.currency : null,
        status,
      };
    });

    return {
      enrollments: enrollmentsData,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      categories,
      metrics: { totalStudents, activeStudents, newThisMonth, totalEnrollments },
    };
  });

export const updateStudentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string().trim().min(2).optional(),
      phone: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const student = await prisma.user.findFirst({ where: { id: data.id, role: "STUDENT" } });
    if (!student) throw new Error("Student not found");

    await prisma.user.update({
      where: { id: data.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
      },
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
