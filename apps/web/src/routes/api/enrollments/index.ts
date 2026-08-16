import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import { CORS_HEADERS, corsOptions, verifyBearerToken } from "../_helpers";

const ENROLLMENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;
const accessExpired = (expiresAt: Date | null | undefined) =>
  !!expiresAt && expiresAt.getTime() <= Date.now();
const accessExpiresAt = () => new Date(Date.now() + ENROLLMENT_DURATION_MS);

export const APIRoute = createAPIFileRoute("/api/enrollments/")({
  OPTIONS: corsOptions,

  /** GET /api/enrollments — list all enrolled courses with progress */
  GET: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);

      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              lessons: { select: { id: true, duration: true }, orderBy: { order: "asc" } },
              category: true,
            },
          },
        },
      });

      const lessonIds = enrollments.flatMap(({ course }) => course.lessons.map((l) => l.id));
      const progressRows = await prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds } },
        select: { lessonId: true, progressSeconds: true, completed: true },
      });
      const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

      const data = enrollments.map((enrollment) => {
        const { course } = enrollment;
        const { lessons, ...rest } = course;
        const total = lessons.length;
        const completed = lessons.filter((l) => progressByLesson.get(l.id)?.completed).length;
        const totalDuration = lessons.reduce((s, l) => s + (l.duration || 0), 0);
        const watchedDuration = lessons.reduce((s, l) => {
          const p = progressByLesson.get(l.id);
          if (p?.completed) return s + (l.duration || 0);
          return s + Math.min(p?.progressSeconds || 0, l.duration || 0);
        }, 0);
        let progress = totalDuration > 0 ? Math.round((watchedDuration / totalDuration) * 100) : 0;
        if (total > 0) progress = Math.max(progress, Math.round((completed / total) * 100));

        return {
          ...rest,
          totalLessons: total,
          completedLessons: completed,
          progress: Math.min(progress, 100),
          expiresAt: enrollment.expiresAt,
          expired: accessExpired(enrollment.expiresAt),
        };
      });

      return Response.json({ enrollments: data }, { headers: CORS_HEADERS });
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[GET /api/enrollments]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },

  /** POST /api/enrollments — enroll in a course (mock payment) */
  POST: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);
      const { courseId } = await request.json();
      if (!courseId) {
        return Response.json({ error: "courseId is required" }, { status: 400, headers: CORS_HEADERS });
      }

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, price: true },
      });
      if (!course) {
        return Response.json({ error: "Course not found" }, { status: 404, headers: CORS_HEADERS });
      }

      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true, paymentId: true, expiresAt: true },
      });
      if (existing && !accessExpired(existing.expiresAt)) {
        return Response.json({ success: true, alreadyEnrolled: true }, { headers: CORS_HEADERS });
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
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
          data: { userId, courseId, paymentId: payment.id, expiresAt: accessExpiresAt() },
        });
      }

      return Response.json({ success: true }, { status: 201, headers: CORS_HEADERS });
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[POST /api/enrollments]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },
});
