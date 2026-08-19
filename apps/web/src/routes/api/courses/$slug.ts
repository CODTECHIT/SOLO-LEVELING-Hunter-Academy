import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import { CORS_HEADERS, corsOptions, verifyBearerToken } from "../_helpers";

const ENROLLMENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;
const accessExpired = (expiresAt: Date | null | undefined) =>
  !!expiresAt && expiresAt.getTime() <= Date.now();

export const APIRoute = createAPIFileRoute("/api/courses/$slug")({
  OPTIONS: corsOptions,

  GET: async ({ request, params }) => {
    try {
      const course = await prisma.course.findUnique({
        where: { slug: params.slug },
        include: {
          lessons: { orderBy: { order: "asc" } },
          category: true,
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
        return Response.json({ error: "Course not found" }, { status: 404, headers: CORS_HEADERS });
      }

      // Check enrollment if authenticated
      let isEnrolled = false;
      let hasAccessExpired = false;
      let completedLessonIds: string[] = [];
      let lessonProgress: Record<string, number> = {};

      try {
        const { userId } = await verifyBearerToken(request);
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
          select: { expiresAt: true },
        });
        hasAccessExpired = accessExpired(enrollment?.expiresAt);
        isEnrolled = !!enrollment && !hasAccessExpired;

        if (userId) {
          const progress = await prisma.lessonProgress.findMany({
            where: { userId, lessonId: { in: course.lessons.map((l) => l.id) } },
            select: { lessonId: true, progressSeconds: true, completed: true },
          });
          completedLessonIds = progress.filter((p) => p.completed).map((p) => p.lessonId);
          lessonProgress = Object.fromEntries(
            progress.map((p) => [p.lessonId, p.progressSeconds]),
          );
        }
      } catch {
        // Not authenticated — guest view, isEnrolled stays false
      }

      return Response.json(
        { course, isEnrolled, hasAccessExpired, completedLessonIds, lessonProgress },
        { headers: CORS_HEADERS },
      );
    } catch (err) {
      console.error("[/api/courses/$slug]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },
});
