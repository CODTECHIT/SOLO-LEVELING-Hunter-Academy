import { createAPIFileRoute } from "./_helpers";
import { prisma } from "@/server/db";
import { CORS_HEADERS, corsOptions, verifyBearerToken } from "./_helpers";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const APIRoute = createAPIFileRoute("/api/profile")({
  OPTIONS: corsOptions,

  GET: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
      });
      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404, headers: CORS_HEADERS });
      }
      return Response.json({ user }, { headers: CORS_HEADERS });
    } catch (err) {
      if (err instanceof Response) return err;
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },

  PATCH: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);
      const body = await request.json();
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400, headers: CORS_HEADERS },
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        },
      });

      return Response.json({ success: true }, { headers: CORS_HEADERS });
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[PATCH /api/profile]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },
});
