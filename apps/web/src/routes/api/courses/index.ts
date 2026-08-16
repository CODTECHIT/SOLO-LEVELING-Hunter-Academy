import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import { CORS_HEADERS, corsOptions } from "../_helpers";

export const APIRoute = createAPIFileRoute("/api/courses/")({
  OPTIONS: corsOptions,

  GET: async ({ request }) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("q") ?? "";
      const categoryId = searchParams.get("category") ?? "";

      const where: Record<string, unknown> = { published: true };
      if (categoryId) where.categoryId = categoryId;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const courses = await prisma.course.findMany({
        where,
        include: {
          category: true,
          lessons: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const categories = await prisma.category.findMany();

      const fullCourses = courses.filter((c) => c.type === "FULL");
      const moduleCourses = courses.filter((c) => c.type === "MODULE");

      return Response.json(
        { courses, fullCourses, moduleCourses, categories },
        { headers: CORS_HEADERS },
      );
    } catch (err) {
      console.error("[/api/courses]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },
});
