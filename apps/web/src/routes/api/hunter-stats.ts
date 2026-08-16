import { createAPIFileRoute } from "./_helpers";
import { prisma } from "@/server/db";
import { CORS_HEADERS, corsOptions, verifyBearerToken } from "./_helpers";

const ranks = [
  { letter: "E", name: "Novice Hunter", floor: 0, next: 1000 },
  { letter: "D", name: "Initiate Hunter", floor: 1000, next: 3000 },
  { letter: "C", name: "Adept Hunter", floor: 3000, next: 7000 },
  { letter: "B", name: "Elite Hunter", floor: 7000, next: 15000 },
  { letter: "A", name: "Veteran Hunter", floor: 15000, next: 30000 },
  { letter: "S", name: "Legendary Hunter", floor: 30000, next: null },
];

export const APIRoute = createAPIFileRoute("/api/hunter-stats")({
  OPTIONS: corsOptions,

  GET: async ({ request }) => {
    const empty = {
      rankLetter: "E",
      rankName: ranks[0].name,
      expTotal: 0,
      expCurrent: 0,
      expMax: 1000,
      focusPct: 0,
      mpPercent: 0,
      streak: 0,
      coursesTaken: 0,
      coursesCompleted: 0,
      lessonsCompleted: 0,
    };

    try {
      const { userId } = await verifyBearerToken(request);

      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: { include: { lessons: { select: { id: true, duration: true } } } } },
      });

      const lessonIds = enrollments.flatMap((e) => e.course.lessons.map((l) => l.id));
      const progressRows = await prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds } },
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
            watchedDuration += p?.completed
              ? l.duration
              : Math.min(p?.progressSeconds || 0, l.duration);
          }
        }
      }

      const expTotal = coursesTaken * 50 + lessonsCompleted * 25 + coursesCompleted * 200;
      const rank = ranks.find((r) => r.next === null || expTotal < r.next) || ranks[0];
      const expCurrent = expTotal - rank.floor;
      const expMax = (rank.next ?? rank.floor + 10000) - rank.floor;
      const totalLessons = lessonIds.length;
      const focusPct =
        totalDuration > 0
          ? Math.min(Math.round((watchedDuration / totalDuration) * 100), 100)
          : totalLessons > 0
            ? Math.min(Math.round((lessonsCompleted / totalLessons) * 100), 100)
            : 0;

      const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const days = new Set(
        progressRows
          .filter((p) => p.completed && p.completedAt)
          .map((p) => dayKey(new Date(p.completedAt as Date))),
      );
      let streak = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);
      if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
      while (days.has(dayKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }

      return Response.json(
        {
          rankLetter: rank.letter,
          rankName: rank.name,
          expTotal,
          expCurrent,
          expMax,
          focusPct,
          mpPercent: Math.min(Math.round((streak / 7) * 100), 100),
          streak,
          coursesTaken,
          coursesCompleted,
          lessonsCompleted,
        },
        { headers: CORS_HEADERS },
      );
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[GET /api/hunter-stats]", err);
      return Response.json(empty, { headers: CORS_HEADERS });
    }
  },
});
