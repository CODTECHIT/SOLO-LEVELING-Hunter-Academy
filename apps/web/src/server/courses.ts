import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";
import { createNotification } from "./notifications";

// A purchase grants access for 1 year from the date of purchase.
const ENROLLMENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;
const accessExpired = (expiresAt: Date | null | undefined) =>
  !!expiresAt && expiresAt.getTime() <= Date.now();
const accessExpiresAt = () => new Date(Date.now() + ENROLLMENT_DURATION_MS);

export async function updateUserStreak(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastStudyDate: true },
    });
    if (!user) return null;

    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

    let newStreak = user.currentStreak || 0;
    let lastDateStr: string | null = null;
    if (user.lastStudyDate) {
      const d = new Date(user.lastStudyDate);
      lastDateStr = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
    }

    if (!lastDateStr) {
      newStreak = 1;
    } else if (lastDateStr === todayStr) {
      return { currentStreak: newStreak, longestStreak: user.longestStreak || newStreak };
    } else {
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = `${yesterday.getUTCFullYear()}-${yesterday.getUTCMonth() + 1}-${yesterday.getUTCDate()}`;

      if (lastDateStr === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak);

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastStudyDate: now,
      },
    });

    return { currentStreak: newStreak, longestStreak };
  } catch (err) {
    console.error("Failed to update user streak:", err);
    return null;
  }
}

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
          include: {
            quiz: {
              select: { id: true, title: true, timeLimit: true, passingScore: true },
            },
          },
        },
        quizzes: {
          select: { id: true, title: true, lessonId: true, timeLimit: true, passingScore: true },
        },
        category: true,
        faqs: {
          orderBy: { order: "asc" },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // If no course-specific FAQs exist, fall back to global FAQs
    let courseFaqs = course.faqs;
    if (!courseFaqs || courseFaqs.length === 0) {
      courseFaqs = await prisma.faqItem.findMany({
        where: { courseId: null },
        orderBy: { order: "asc" },
      });
    }

    // Check enrollment if logged in
    const user = await getCurrentUserFn();
    let isEnrolled = false;
    let hasAccessExpired = false;
    let completedLessonIds: string[] = [];
    let lessonProgress: Record<string, number> = {};

    if (user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
        select: { expiresAt: true },
      });
      hasAccessExpired = accessExpired(enrollment?.expiresAt);
      isEnrolled = !!enrollment && !hasAccessExpired;

      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          lessonId: { in: course.lessons.map((l) => l.id) },
        },
        select: { lessonId: true, progressSeconds: true, completed: true },
      });
      completedLessonIds = progress.filter((p) => p.completed).map((p) => p.lessonId);
      lessonProgress = Object.fromEntries(progress.map((p) => [p.lessonId, p.progressSeconds]));
    }

    return {
      course: {
        ...course,
        faqs: courseFaqs,
      },
      isEnrolled,
      hasAccessExpired,
      completedLessonIds,
      lessonProgress,
      currentUser: user ? { id: user.id, name: user.name, email: user.email } : null,
    };
  });

export const enrollUserFn = createServerFn({ method: "POST" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Must be logged in to enroll");

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, price: true, title: true },
    });
    if (!course) throw new Error("Course not found");

    // Idempotent: if already enrolled with active access, don't create a
    // duplicate Payment or Enrollment record. Expired enrollments go through
    // the purchase flow again, which renews access for another year.
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId,
        },
      },
      select: { id: true, paymentId: true, expiresAt: true },
    });
    if (existing && !accessExpired(existing.expiresAt)) return { success: true };

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

    if (existing) {
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: { paymentId: payment.id, expiresAt: accessExpiresAt() },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: data.courseId,
          paymentId: payment.id,
          expiresAt: accessExpiresAt(),
        },
      });
    }

    // Create notification for course enrollment
    try {
      await createNotification({
        userId: user.id,
        title: "🎉 Course Unlocked!",
        message: `You now have full access to "${course.title}". Start learning today!`,
        type: "COURSE_PURCHASED",
        data: { courseId: course.id },
      });
    } catch {
      // Non-blocking
    }

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
      select: { id: true, courseId: true },
    });
    if (!lesson) throw new Error("Lesson not found");

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.courseId,
        },
      },
      select: { id: true, expiresAt: true },
    });
    if (!enrollment) throw new Error("Must be enrolled in this course to mark lessons complete");
    if (accessExpired(enrollment.expiresAt)) {
      throw new Error("Your access to this course has expired. Renew it to continue.");
    }

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

    // Update study streak
    await updateUserStreak(user.id);

    // Check if course 100% complete -> award certificate & notify
    try {
      const totalLessons = await prisma.lesson.count({ where: { courseId: lesson.courseId } });
      const completedCount = await prisma.lessonProgress.count({
        where: {
          userId: user.id,
          completed: true,
          lesson: { courseId: lesson.courseId },
        },
      });
      if (totalLessons > 0 && completedCount >= totalLessons) {
        const cert = await prisma.certificate.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
        });
        if (!cert) {
          await prisma.certificate.create({
            data: { userId: user.id, courseId: lesson.courseId },
          });
          const crs = await prisma.course.findUnique({
            where: { id: lesson.courseId },
            select: { title: true },
          });
          await createNotification({
            userId: user.id,
            title: "🏆 Official Certificate Awarded!",
            message: `Congratulations! You conquered all lessons in "${crs?.title || "your course"}" and earned your verified Certificate!`,
            type: "CERTIFICATE_EARNED",
            data: { courseId: lesson.courseId },
          });
        }
      }
    } catch {
      // Non-blocking
    }

    return { success: true };
  });

const lessonProgressSchema = z.object({
  lessonId: z.string(),
  watchedSeconds: z.number().min(0),
  duration: z.number().min(0).optional(),
});

// Records real watch time for a lesson and auto-completes it once the student
// has watched at least 90% of the video. progressSeconds only ever grows (max),
// so scrubbing back or replaying cannot reduce recorded progress.
export const updateLessonProgressFn = createServerFn({ method: "POST" })
  .validator((data) => lessonProgressSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Must be logged in");

    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      select: { id: true, courseId: true, duration: true },
    });
    if (!lesson) throw new Error("Lesson not found");

    // Only enrolled students may record progress; otherwise any logged-in user
    // could forge watch time on courses they never paid for.
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.courseId,
        },
      },
      select: { id: true, expiresAt: true },
    });
    if (!enrollment) throw new Error("Must be enrolled in this course to track progress");
    if (accessExpired(enrollment.expiresAt)) {
      throw new Error("Your access to this course has expired. Renew it to continue.");
    }

    // Persist the detected video duration on the lesson so the completion
    // threshold stays stable even if the client reports again later.
    const duration =
      data.duration && data.duration > 0 ? Math.round(data.duration) : lesson.duration;
    if (duration !== lesson.duration) {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { duration } });
    }

    const existing = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: data.lessonId,
        },
      },
      select: { completed: true, progressSeconds: true },
    });

    const progressSeconds = Math.max(
      existing ? existing.progressSeconds : 0,
      Math.round(data.watchedSeconds),
    );
    const threshold = duration && duration > 0 ? Math.ceil(duration * 0.9) : null;
    const completed =
      existing?.completed === true || (threshold !== null && progressSeconds >= threshold);

    const row = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: data.lessonId,
        },
      },
      update: {
        progressSeconds,
        completed,
        completedAt: completed && !existing?.completed ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        lessonId: data.lessonId,
        progressSeconds,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    // Update study streak on progress
    await updateUserStreak(user.id);

    // If completed and all lessons in course done -> award certificate and notify
    if (completed && lesson.courseId) {
      try {
        const totalLessons = await prisma.lesson.count({ where: { courseId: lesson.courseId } });
        const completedCount = await prisma.lessonProgress.count({
          where: {
            userId: user.id,
            completed: true,
            lesson: { courseId: lesson.courseId },
          },
        });
        if (totalLessons > 0 && completedCount >= totalLessons) {
          const cert = await prisma.certificate.findUnique({
            where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
          });
          if (!cert) {
            await prisma.certificate.create({
              data: { userId: user.id, courseId: lesson.courseId },
            });
            const crs = await prisma.course.findUnique({
              where: { id: lesson.courseId },
              select: { title: true },
            });
            await createNotification({
              userId: user.id,
              title: "🏆 Official Certificate Awarded!",
              message: `Congratulations! You conquered all lessons in "${crs?.title || "your course"}" and earned your verified Certificate!`,
              type: "CERTIFICATE_EARNED",
              data: { courseId: lesson.courseId },
            });
          }
        }
      } catch {
        // Non-blocking
      }
    }

    return { progressSeconds: row.progressSeconds, completed: row.completed };
  });

export const getEnrolledCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          lessons: {
            select: { id: true, duration: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  const lessonIds = enrollments.flatMap(({ course }) => course.lessons.map((l) => l.id));

  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: lessonIds } },
    select: { lessonId: true, progressSeconds: true, completed: true },
  });
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  return enrollments.map(({ course, enrolledAt, expiresAt }) => {
    const total = course.lessons.length;
    const completed = course.lessons.filter((l) => progressByLesson.get(l.id)?.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...course,
      totalLessons: total,
      completedLessons: completed,
      enrolledAt,
      expiresAt,
      expired: accessExpired(expiresAt),
      hasAccessExpired: accessExpired(expiresAt),
      progress,
    };
  });
});

const ranks = [
  { letter: "E", name: "Novice Hunter", floor: 0, next: 1000 },
  { letter: "D", name: "Initiate Hunter", floor: 1000, next: 3000 },
  { letter: "C", name: "Adept Hunter", floor: 3000, next: 7000 },
  { letter: "B", name: "Elite Hunter", floor: 7000, next: 15000 },
  { letter: "A", name: "Veteran Hunter", floor: 15000, next: 30000 },
  { letter: "S", name: "Legendary Hunter", floor: 30000, next: null },
];

// Hunter dashboard stats, derived from real activity:
//  - EXP:  +50 per course taken, +25 per lesson completed, +200 per course completed
//  - Rank: tier of total EXP (E -> D -> C -> B -> A -> S)
//  - HP/Focus: % of total course video watched (weighted by duration)
//  - MP/Streak: consecutive active days ending today or yesterday (7 days = 100%)
export const getHunterStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) {
    return {
      rankLetter: "E",
      rankName: "E-Rank Hunter",
      expTotal: 0,
      expCurrent: 0,
      expMax: 1000,
      focusPct: 0,
      mpPercent: 0,
      streak: 0,
      longestStreak: 0,
      coursesTaken: 0,
      coursesCompleted: 0,
      lessonsCompleted: 0,
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          lessons: { select: { id: true, duration: true } },
        },
      },
    },
  });

  const lessonIds = enrollments.flatMap((e) => e.course.lessons.map((l) => l.id));

  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: lessonIds } },
    select: { lessonId: true, progressSeconds: true, completed: true, completedAt: true },
  });
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  const coursesTaken = enrollments.length;
  let coursesCompleted = 0;
  let lessonsCompleted = 0;
  let totalDuration = 0;
  let watchedDuration = 0;

  for (const { course } of enrollments) {
    const done = course.lessons.filter((l) => progressByLesson.get(l.id)?.completed).length;
    lessonsCompleted += done;
    if (course.lessons.length > 0 && done >= course.lessons.length) coursesCompleted++;
    for (const l of course.lessons) {
      if (l.duration) {
        totalDuration += l.duration;
        const p = progressByLesson.get(l.id);
        watchedDuration += p?.completed ? l.duration : Math.min(p?.progressSeconds || 0, l.duration);
      }
    }
  }

  const expTotal = coursesTaken * 50 + lessonsCompleted * 25 + coursesCompleted * 200;
  const rank = ranks.find((r) => r.next === null || expTotal < r.next) || ranks[0];
  const tierFloor = rank.floor;
  const tierCeiling = rank.next ?? tierFloor + 10000;
  const expCurrent = expTotal - tierFloor;
  const expMax = tierCeiling - tierFloor;

  const totalLessons = lessonIds.length;
  const focusPct =
    totalDuration > 0
      ? Math.min(Math.round((watchedDuration / totalDuration) * 100), 100)
      : totalLessons > 0
        ? Math.min(Math.round((lessonsCompleted / totalLessons) * 100), 100)
        : 0;

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { currentStreak: true, longestStreak: true, lastStudyDate: true },
  });

  const currentStreak = userRecord?.currentStreak || 0;
  const longestStreak = userRecord?.longestStreak || currentStreak;
  const mpPercent = Math.min(Math.round((currentStreak / 7) * 100), 100);

  return {
    rankLetter: rank.letter,
    rankName: rank.name,
    expTotal,
    expCurrent,
    expMax,
    focusPct,
    mpPercent: mpPercent > 0 ? mpPercent : focusPct,
    streak: currentStreak,
    longestStreak,
    coursesTaken,
    coursesCompleted,
    lessonsCompleted,
  };
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
    if (!user) throw new Error("Must be logged in to submit a review");

    await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment ?? "",
      },
      create: {
        userId: user.id,
        courseId: data.courseId,
        rating: data.rating,
        comment: data.comment ?? "",
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

export const getCourseFaqsFn = createServerFn({ method: "GET" })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const courseFaqs = await prisma.faqItem.findMany({
      where: { courseId: data.courseId },
      orderBy: { order: "asc" },
    });

    // Fall back to the global FAQ list managed in the admin FAQ section when
    // the course/module has no FAQs of its own.
    if (courseFaqs.length > 0) return { faqs: courseFaqs };

    const globalFaqs = await prisma.faqItem.findMany({
      where: { courseId: null },
      orderBy: { order: "asc" },
    });
    return { faqs: globalFaqs };
  });

export const getPublicFaqsFn = createServerFn({ method: "GET" }).handler(async () => {
  const faqs = await prisma.faqItem.findMany({
    where: { courseId: null },
    orderBy: { order: "asc" },
  });
  return { faqs };
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
