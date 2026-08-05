import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";

export const getCatalogFn = createServerFn({ method: "GET" }).handler(async () => {
  const categories = await prisma.category.findMany({
    include: {
      courses: {
        where: { published: true },
      },
    },
  });

  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      category: true,
      lessons: {
        select: { id: true },
      },
    },
  });

  // Two course tiers, shown in separate sections:
  //  - FULL  -> "Courses" (complete pathways, e.g. ₹3,999)
  //  - MODULE -> "Hunter Pass" (short topic-wise modules, e.g. ₹399)
  const fullCourses = courses.filter((c) => c.type === "FULL");
  const moduleCourses = courses.filter((c) => c.type === "MODULE");

  return { categories, courses, fullCourses, moduleCourses };
});

export const getCourseFn = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const course = await prisma.course.findUnique({
      where: { slug: data.slug },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        category: true,
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Check enrollment if logged in
    const user = await getCurrentUserFn();
    let isEnrolled = false;
    let completedLessonIds: string[] = [];

    if (user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });
      isEnrolled = !!enrollment;

      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          completed: true,
          lessonId: { in: course.lessons.map((l) => l.id) },
        },
        select: { lessonId: true },
      });
      completedLessonIds = progress.map((p) => p.lessonId);
    }

    return { course, isEnrolled, completedLessonIds };
  });

export const enrollUserFn = createServerFn({ method: "POST" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Must be logged in to enroll");

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, price: true },
    });
    if (!course) throw new Error("Course not found");

    // Idempotent: if already enrolled (e.g. a re-visit), don't create a
    // duplicate Payment or Enrollment record.
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId,
        },
      },
      select: { id: true, paymentId: true },
    });
    if (existing) return { success: true };

    // Mock checkout: record a paid Payment so Purchase History and refund
    // eligibility reflect real data, then link it to the enrollment.
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        amount: course.price,
        currency: "INR",
        status: "PAID",
        razorpayOrderId: `mock_${crypto.randomUUID()}`,
        razorpayPaymentId: `mock_${crypto.randomUUID()}`,
      },
    });

    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: data.courseId,
        paymentId: payment.id,
      },
    });

    return { success: true };
  });

export const markLessonCompletedFn = createServerFn({ method: "POST" })
  .validator((data: { lessonId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Must be logged in");

    // Only enrolled students may mark lessons complete; otherwise any logged-in
    // user could forge progress on courses they never paid for.
    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      select: { courseId: true },
    });
    if (!lesson) throw new Error("Lesson not found");

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.courseId,
        },
      },
      select: { id: true },
    });
    if (!enrollment) throw new Error("Must be enrolled in this course to mark lessons complete");

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: data.lessonId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        lessonId: data.lessonId,
        completed: true,
        completedAt: new Date(),
      },
    });

    return { success: true };
  });

export const getEnrolledCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          lessons: { select: { id: true } },
        },
      },
    },
  });

  // Map course -> lesson ids for the enrolled courses, then fetch which of
  // those lessons this user has actually completed so the dashboard can show
  // real progress instead of hardcoded placeholders.
  const courseToLessonIds = new Map<string, string[]>();
  enrollments.forEach(({ course }) => {
    courseToLessonIds.set(
      course.id,
      course.lessons.map((l) => l.id),
    );
  });
  const lessonIds = enrollments.flatMap(({ course }) => course.lessons.map((l) => l.id));

  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId: user.id, completed: true, lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(progressRows.map((p) => p.lessonId));

  return enrollments.map(({ course }) => {
    const lessons = courseToLessonIds.get(course.id) || [];
    const { lessons: _lessons, ...rest } = course;
    const completed = lessons.filter((id) => completedLessonIds.has(id)).length;
    const total = lessons.length;
    return {
      ...rest,
      totalLessons: total,
      completedLessons: completed,
      progress: total ? Math.round((completed / total) * 100) : 0,
    };
  });
});

// Backfill: enrollments created before the mock-checkout recorded a Payment
// (or via older code paths) get a paid Payment lazily, so Purchase History and
// refund eligibility always reflect real data. Idempotent: only processes
// enrollments that have no linked payment, and links them immediately.
async function backfillPayments(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, paymentId: null },
    include: { course: { select: { id: true, price: true } } },
  });
  for (const enrollment of enrollments) {
    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId: enrollment.course.id,
        amount: enrollment.course.price,
        currency: "INR",
        status: "PAID",
        razorpayOrderId: `mock_${crypto.randomUUID()}`,
        razorpayPaymentId: `mock_${crypto.randomUUID()}`,
      },
    });
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { paymentId: payment.id },
    });
  }
}

export const getPurchasesFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  await backfillPayments(user.id);

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Also fetch courses for these payments
  const courseIds = payments.map((p) => p.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  });

  return payments.map((p) => ({
    ...p,
    courseTitle: courses.find((c) => c.id === p.courseId)?.title || "Unknown Course",
  }));
});

const refundSchema = z.object({
  paymentId: z.string(),
  reason: z.string().min(10),
});

export const submitRefundFn = createServerFn({ method: "POST" })
  .validator((data) => refundSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Must be logged in");

    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!payment || payment.userId !== user.id) {
      throw new Error("Payment not found or not authorized");
    }

    // The client hides already-requested purchases, but the server must enforce
    // it too: without this a user could submit unlimited PENDING refunds for the
    // same payment via direct calls.
    const existing = await prisma.refund.findFirst({
      where: { paymentId: data.paymentId, status: "PENDING" },
      select: { id: true },
    });
    if (existing) {
      throw new Error("A refund request for this purchase is already pending");
    }

    const refund = await prisma.refund.create({
      data: {
        userId: user.id,
        paymentId: data.paymentId,
        reason: data.reason,
        status: "PENDING",
      },
    });

    return { success: true, refund };
  });

export const getRefundsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  const refunds = await prisma.refund.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const paymentIds = refunds.map((r) => r.paymentId);
  const payments = await prisma.payment.findMany({
    where: { id: { in: paymentIds } },
  });

  const courseIds = payments.map((p) => p.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  });

  return refunds.map((r) => {
    const payment = payments.find((p) => p.id === r.paymentId);
    const courseTitle = payment
      ? courses.find((c) => c.id === payment.courseId)?.title
      : "Unknown Course";
    return {
      ...r,
      courseTitle: courseTitle || "Unknown Course",
    };
  });
});

const reviewSchema = z.object({
  courseId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const submitReviewFn = createServerFn({ method: "POST" })
  .validator((data) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Must be logged in");

    // Check if enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error("Must be enrolled to review");
    }

    await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment,
      },
      create: {
        userId: user.id,
        courseId: data.courseId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    return { success: true };
  });

export const getCourseReviewsFn = createServerFn({ method: "GET" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const reviews = await prisma.review.findMany({
      where: { courseId: data.courseId },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return reviews;
  });

export const getStudentNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: { select: { title: true } } },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });

  const refunds = await prisma.refund.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const refundPaymentIds = refunds.map((r) => r.paymentId);
  const refundPayments = await prisma.payment.findMany({
    where: { id: { in: refundPaymentIds } },
    select: { id: true, courseId: true },
  });
  const refundCourseIds = refundPayments.map((p) => p.courseId);
  const refundCourses = await prisma.course.findMany({
    where: { id: { in: refundCourseIds } },
    select: { id: true, title: true },
  });

  const notifications: {
    id: string;
    title: string;
    message: string;
    createdAt: Date;
  }[] = [];

  for (const e of enrollments) {
    notifications.push({
      id: `enroll-${e.id}`,
      title: "Enrollment Confirmed",
      message: `You unlocked "${e.course.title}".`,
      createdAt: e.enrolledAt,
    });
  }

  for (const r of refunds) {
    const courseId = refundPayments.find((p) => p.id === r.paymentId)?.courseId;
    const courseTitle = courseId
      ? refundCourses.find((c) => c.id === courseId)?.title || "course"
      : "course";
    if (r.status === "PENDING") {
      notifications.push({
        id: `refund-${r.id}`,
        title: "Refund In Review",
        message: `Your refund request for "${courseTitle}" is being processed.`,
        createdAt: r.createdAt,
      });
    } else if (r.status === "APPROVED") {
      notifications.push({
        id: `refund-${r.id}`,
        title: "Refund Approved",
        message: `Your refund for "${courseTitle}" was approved.`,
        createdAt: r.createdAt,
      });
    }
  }

  notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notifications.slice(0, 10);
});
