import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import { CORS_HEADERS, corsOptions, verifyBearerToken } from "../_helpers";
import { z } from "zod";

const progressSchema = z.object({
  lessonId: z.string(),
  watchedSeconds: z.number().min(0),
  duration: z.number().min(0).optional(),
});

const accessExpired = (expiresAt: Date | null | undefined) =>
  !!expiresAt && expiresAt.getTime() <= Date.now();

export const APIRoute = createAPIFileRoute("/api/progress/update")({
  OPTIONS: corsOptions,

  POST: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);
      const body = await request.json();
      const parsed = progressSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      const { lessonId, watchedSeconds, duration: clientDuration } = parsed.data;

      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, courseId: true, duration: true },
      });
      if (!lesson) {
        return Response.json({ error: "Lesson not found" }, { status: 404, headers: CORS_HEADERS });
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.courseId } },
        select: { id: true, expiresAt: true },
      });
      if (!enrollment) {
        return Response.json({ error: "Not enrolled" }, { status: 403, headers: CORS_HEADERS });
      }
      if (accessExpired(enrollment.expiresAt)) {
        return Response.json({ error: "Access expired" }, { status: 403, headers: CORS_HEADERS });
      }

      const duration =
        clientDuration && clientDuration > 0 ? Math.round(clientDuration) : lesson.duration;
      if (duration !== lesson.duration) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { duration } });
      }

      const existing = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
        select: { completed: true, progressSeconds: true },
      });

      const progressSeconds = Math.max(
        existing ? existing.progressSeconds : 0,
        Math.round(watchedSeconds),
      );
      const threshold = duration && duration > 0 ? Math.ceil(duration * 0.9) : null;
      const completed =
        existing?.completed === true || (threshold !== null && progressSeconds >= threshold);

      const row = await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          progressSeconds,
          completed,
          completedAt: completed && !existing?.completed ? new Date() : undefined,
        },
        create: {
          userId,
          lessonId,
          progressSeconds,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      return Response.json(
        { progressSeconds: row.progressSeconds, completed: row.completed },
        { headers: CORS_HEADERS },
      );
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[POST /api/progress/update]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },
});
