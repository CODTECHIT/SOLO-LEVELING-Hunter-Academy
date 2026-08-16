import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "solo-leveling-secret-key-123");
  if (!secret) throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(secret);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const APIRoute = createAPIFileRoute("/api/auth/me")({
  OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

  GET: async ({ request }) => {
    try {
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }

      const token = authHeader.slice(7);
      const { payload } = await jwtVerify(token, getJwtSecret());
      if (!payload.userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
        select: { id: true, name: true, email: true, role: true, phone: true },
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404, headers: CORS });
      }

      return Response.json({ user }, { headers: CORS });
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
    }
  },
});
