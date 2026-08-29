import { createServerFn } from "@tanstack/react-start";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";
import { ensurePermission, ensureAdmin } from "./permissions";
import { createNotification } from "./notifications";
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

export type RevenuePeriod =
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "12m"
  | "year"
  | "custom"
  | "all";

export function computeRevenueChartData(
  payments: { amount: number; createdAt: Date; status: string }[],
  options?: {
    period?: RevenuePeriod;
    selectedYear?: number;
    startDate?: string;
    endDate?: string;
  },
) {
  const period: RevenuePeriod = options?.period || "6m";
  const now = new Date();
  const paidPayments = payments.filter((p) => p.status === "PAID");

  // Distinct available years from payment history
  const paymentYears = Array.from(
    new Set(paidPayments.map((p) => new Date(p.createdAt).getFullYear())),
  ).sort((a, b) => b - a);

  if (!paymentYears.includes(now.getFullYear())) {
    paymentYears.unshift(now.getFullYear());
  }

  // 1. SPECIFIC YEAR (12 Months Jan-Dec)
  if (period === "year" || options?.selectedYear) {
    const targetYear = options?.selectedYear || now.getFullYear();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const buckets = months.map((monthName, mIdx) => {
      const matches = paidPayments.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate.getFullYear() === targetYear && pDate.getMonth() === mIdx;
      });
      const amount = matches.reduce((sum, p) => sum + p.amount, 0);
      return {
        label: monthName,
        amount,
        orders: matches.length,
        dateKey: `${targetYear}-${String(mIdx + 1).padStart(2, "0")}`,
      };
    });
    const periodRevenue = buckets.reduce((s, b) => s + b.amount, 0);
    return {
      buckets,
      periodRevenue,
      availableYears: paymentYears,
      selectedYear: targetYear,
    };
  }

  // 2. CUSTOM CALENDAR DATE RANGE
  if (period === "custom" && options?.startDate && options?.endDate) {
    const start = new Date(options.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(options.endDate);
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.max(
      1,
      Math.min(
        120,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      ),
    );
    const buckets: {
      label: string;
      amount: number;
      orders: number;
      dateKey: string;
    }[] = [];

    for (let i = 0; i < diffDays; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const dateKey = cur.toISOString().slice(0, 10);
      const label = cur.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const matches = paidPayments.filter(
        (p) => new Date(p.createdAt).toISOString().slice(0, 10) === dateKey,
      );
      const amount = matches.reduce((sum, p) => sum + p.amount, 0);
      buckets.push({ label, amount, orders: matches.length, dateKey });
    }
    const periodRevenue = buckets.reduce((s, b) => s + b.amount, 0);
    return {
      buckets,
      periodRevenue,
      availableYears: paymentYears,
      selectedYear: now.getFullYear(),
    };
  }

  // 3. 7 DAYS
  if (period === "7d") {
    const buckets: {
      label: string;
      amount: number;
      orders: number;
      dateKey: string;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      });
      const matches = paidPayments.filter(
        (p) => new Date(p.createdAt).toISOString().slice(0, 10) === dateKey,
      );
      const amount = matches.reduce((sum, p) => sum + p.amount, 0);
      buckets.push({ label, amount, orders: matches.length, dateKey });
    }
    const periodRevenue = buckets.reduce((s, b) => s + b.amount, 0);
    return {
      buckets,
      periodRevenue,
      availableYears: paymentYears,
      selectedYear: now.getFullYear(),
    };
  }

  // 4. 30 DAYS
  if (period === "30d") {
    const buckets: {
      label: string;
      amount: number;
      orders: number;
      dateKey: string;
    }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const matches = paidPayments.filter(
        (p) => new Date(p.createdAt).toISOString().slice(0, 10) === dateKey,
      );
      const amount = matches.reduce((sum, p) => sum + p.amount, 0);
      buckets.push({ label, amount, orders: matches.length, dateKey });
    }
    const periodRevenue = buckets.reduce((s, b) => s + b.amount, 0);
    return {
      buckets,
      periodRevenue,
      availableYears: paymentYears,
      selectedYear: now.getFullYear(),
    };
  }

  // 5. 3M / 6M / 12M
  if (period === "3m" || period === "6m" || period === "12m") {
    const monthCount = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    const buckets: {
      label: string;
      amount: number;
      orders: number;
      dateKey: string;
    }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const matches = paidPayments.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate.getFullYear() === year && pDate.getMonth() === month;
      });
      const amount = matches.reduce((sum, p) => sum + p.amount, 0);
      buckets.push({
        label,
        amount,
        orders: matches.length,
        dateKey: `${year}-${month}`,
      });
    }
    const periodRevenue = buckets.reduce((s, b) => s + b.amount, 0);
    return {
      buckets,
      periodRevenue,
      availableYears: paymentYears,
      selectedYear: now.getFullYear(),
    };
  }

  // 6. ALL TIME
  const minYear =
    paymentYears.length > 0 ? Math.min(...paymentYears) : now.getFullYear();
  const buckets: {
    label: string;
    amount: number;
    orders: number;
    dateKey: string;
  }[] = [];
  for (let y = minYear; y <= now.getFullYear(); y++) {
    const label = String(y);
    const matches = paidPayments.filter(
      (p) => new Date(p.createdAt).getFullYear() === y,
    );
    const amount = matches.reduce((sum, p) => sum + p.amount, 0);
    buckets.push({ label, amount, orders: matches.length, dateKey: String(y) });
  }
  const periodRevenue = buckets.reduce((s, b) => s + b.amount, 0);
  return {
    buckets,
    periodRevenue,
    availableYears: paymentYears,
    selectedYear: now.getFullYear(),
  };
}

export const getAdminStatsFn = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        period: z
          .enum(["7d", "30d", "3m", "6m", "12m", "year", "custom", "all"])
          .optional(),
        selectedYear: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const user = await ensurePermission("stats");
    const isSuperAdmin = user.role === "ADMIN";

    const [totalUsers, totalCourses, totalEnrollments, allPayments] =
      await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        isSuperAdmin
          ? prisma.payment.findMany({
              select: { amount: true, createdAt: true, status: true },
              orderBy: { createdAt: "asc" },
            })
          : Promise.resolve([]),
      ]);

    const period: RevenuePeriod = data?.period || "6m";
    const totalRevenue = allPayments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const {
      buckets: chartData,
      periodRevenue,
      availableYears,
      selectedYear,
    } = isSuperAdmin
      ? computeRevenueChartData(allPayments, {
          period,
          selectedYear: data?.selectedYear,
          startDate: data?.startDate,
          endDate: data?.endDate,
        })
      : {
          buckets: [],
          periodRevenue: 0,
          availableYears: [new Date().getFullYear()],
          selectedYear: new Date().getFullYear(),
        };

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: isSuperAdmin ? totalRevenue : 0,
      periodRevenue: isSuperAdmin ? periodRevenue : 0,
      chartData: isSuperAdmin ? chartData : [],
      availableYears: isSuperAdmin ? availableYears : [],
      selectedYear: isSuperAdmin ? selectedYear : new Date().getFullYear(),
      isSuperAdmin,
      period,
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
    await ensurePermission("courses");

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
    await ensurePermission("courses");

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
    await ensurePermission("courses");

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
    await ensurePermission("courses");

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
    await ensurePermission("courses");

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
    await ensurePermission("courses");

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
    await ensurePermission("courses");

    const updatedCourse = await prisma.course.update({
      where: { id: data.courseId },
      data: { published: data.published },
    });

    if (data.published) {
      try {
        await createNotification({
          userId: null,
          title: "🔥 New Course Released!",
          message: `"${updatedCourse.title}" is now available in the Course Vault. Begin training!`,
          type: "NEW_COURSE",
          data: { courseId: updatedCourse.id, slug: updatedCourse.slug },
        });
      } catch {
        // Non-blocking
      }
    }

    return updatedCourse;
  });

export const deleteCourseFn = createServerFn({ method: "POST" })
  .validator(z.object({ courseId: z.string() }))
  .handler(async ({ data }) => {
    await ensurePermission("courses");

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
  await ensurePermission("categories");

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
    await ensurePermission("categories");

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
    await ensurePermission("categories");

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
    await ensurePermission("categories");

    const courseCount = await prisma.course.count({ where: { categoryId: data.id } });
    if (courseCount > 0) {
      throw new Error("Cannot delete category with existing courses");
    }

    await prisma.category.delete({ where: { id: data.id } });
    return { success: true };
  });

// ---------- Users ----------

export const createStaffUserFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["ADMIN", "MANAGER", "TECHNICAL_TEAM"]),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const email = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: hashedPassword,
        role: data.role,
      },
    });

    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

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
    await ensurePermission("users");

    const search = data?.search?.trim();
    const categoryId = data?.categoryId;
    const page = data?.page ?? 1;
    const pageSize = data?.pageSize ?? 10;

    // Filter students by name/email/phone and optionally by course category
    const userWhere: Prisma.UserWhereInput = { role: "STUDENT" };
    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId && categoryId !== "ALL") {
      userWhere.enrollments = {
        some: {
          course: {
            categoryId,
          },
        },
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      users,
      categories,
      courses,
      totalStudents,
      activeStudents,
      newThisMonth,
      totalEnrollments,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.user.findMany({
        where: userWhere,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          enrollments: {
            orderBy: { enrolledAt: "desc" },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  categoryId: true,
                  category: { select: { id: true, name: true } },
                  lessons: { select: { id: true } },
                },
              },
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              courseId: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
          },
          progress: {
            select: {
              lessonId: true,
              progressSeconds: true,
              completed: true,
              lesson: { select: { courseId: true } },
            },
          },
        },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.course.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, price: true },
      }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({
        where: { role: "STUDENT", progress: { some: { progressSeconds: { gt: 0 } } } },
      }),
      prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: startOfMonth } } }),
      prisma.enrollment.count({ where: { user: { role: "STUDENT" } } }),
    ]);

    const studentsData = users.map((user) => {
      // Map user enrollments
      const userEnrollmentItems = user.enrollments.map((enrollment) => {
        const totalLessons = enrollment.course.lessons?.length ?? 0;
        const completedLessons = user.progress.filter(
          (p) => p.lesson?.courseId === enrollment.course.id && p.completed,
        ).length;
        const progressSeconds = user.progress
          .filter((p) => p.lesson?.courseId === enrollment.course.id)
          .reduce((sum, p) => sum + p.progressSeconds, 0);

        const payment = user.payments.find((p) => p.courseId === enrollment.course.id && p.status === "PAID") ||
          user.payments.find((p) => p.courseId === enrollment.course.id);

        let status: "Active" | "Inactive" | "Expired";
        if (enrollment.expiresAt && enrollment.expiresAt <= now) {
          status = "Expired";
        } else if (progressSeconds > 0 || completedLessons > 0) {
          status = "Active";
        } else {
          status = "Inactive";
        }

        return {
          id: enrollment.id,
          enrollmentId: enrollment.id,
          courseId: enrollment.course.id,
          title: enrollment.course.title,
          category: enrollment.course.category?.name || "General",
          enrolledAt: enrollment.enrolledAt,
          expiresAt: enrollment.expiresAt,
          amount: payment?.amount ?? null,
          currency: payment?.currency ?? "INR",
          paid: payment?.status === "PAID",
          status,
          totalLessons,
          completedLessons,
          progressPercent:
            totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0,
        };
      });

      const totalPaid = user.payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0);

      const hasStudyActivity = user.progress.some((p) => p.progressSeconds > 0 || p.completed);
      const hasActiveEnrollment = userEnrollmentItems.some(
        (e) => !e.expiresAt || new Date(e.expiresAt) > now,
      );

      let overallStatus: "Active" | "Enrolled" | "Registered" | "Expired";
      if (hasStudyActivity) {
        overallStatus = "Active";
      } else if (hasActiveEnrollment) {
        overallStatus = "Enrolled";
      } else if (userEnrollmentItems.length > 0) {
        overallStatus = "Expired";
      } else {
        overallStatus = "Registered";
      }

      // First enrollment or fallback
      const primaryEnrollment = userEnrollmentItems[0] || null;

      return {
        id: user.id,
        studentId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        lastStudyDate: user.lastStudyDate,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        enrollments: userEnrollmentItems,
        coursesCount: userEnrollmentItems.length,
        course: primaryEnrollment
          ? { id: primaryEnrollment.courseId, title: primaryEnrollment.title, category: primaryEnrollment.category }
          : null,
        enrolledAt: primaryEnrollment?.enrolledAt ?? null,
        expiresAt: primaryEnrollment?.expiresAt ?? null,
        amount: totalPaid > 0 ? totalPaid : primaryEnrollment?.amount ?? null,
        currency: primaryEnrollment?.currency ?? "INR",
        status: overallStatus,
      };
    });

    return {
      students: studentsData,
      enrollments: studentsData, // Backward compatibility alias
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      categories,
      courses,
      metrics: { totalStudents, activeStudents, newThisMonth, totalEnrollments },
    };
  });

export const adminEnrollStudentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      courseId: z.string(),
      expiresInDays: z.number().int().min(1).default(365),
    }),
  )
  .handler(async ({ data }) => {
    await ensurePermission("users");

    const user = await prisma.user.findFirst({ where: { id: data.userId, role: "STUDENT" } });
    if (!user) throw new Error("Student not found");

    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) throw new Error("Course not found");

    const expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000);

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: data.userId, courseId: data.courseId } },
    });

    if (existing) {
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: { expiresAt, enrolledAt: new Date() },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          userId: data.userId,
          courseId: data.courseId,
          enrolledAt: new Date(),
          expiresAt,
        },
      });
    }

    return { success: true };
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
    await ensurePermission("users");

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

// ---------- Payments / Financials (Super Admin Only) ----------

export const getAdminPaymentsFn = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        period: z
          .enum(["7d", "30d", "3m", "6m", "12m", "year", "custom", "all"])
          .optional(),
        selectedYear: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    const period: RevenuePeriod = data?.period || "6m";

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

    const {
      buckets: chartData,
      periodRevenue,
      availableYears,
      selectedYear,
    } = computeRevenueChartData(payments, {
      period,
      selectedYear: data?.selectedYear,
      startDate: data?.startDate,
      endDate: data?.endDate,
    });

    const paidCount = payments.filter((p) => p.status === "PAID").length;
    const pendingCount = payments.filter((p) => p.status === "PENDING").length;
    const failedCount = payments.filter((p) => p.status === "FAILED").length;

    return {
      payments,
      totalRevenue,
      periodRevenue,
      chartData,
      availableYears,
      selectedYear,
      paidCount,
      pendingCount,
      failedCount,
      period,
    };
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

// ---------- Reviews Moderation (Admin & Manager) ----------

export const getAdminReviewsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensurePermission("reviews");

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return { reviews, avgRating };
});

export const deleteReviewFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensurePermission("reviews");
    await prisma.review.delete({ where: { id: data.id } });
    return { success: true };
  });
