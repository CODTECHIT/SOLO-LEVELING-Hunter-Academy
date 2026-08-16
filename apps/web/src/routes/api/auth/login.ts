import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "solo-leveling-secret-key-123");
  if (!secret) throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(secret);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400, headers: CORS },
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });
      if (!user) {
        return Response.json({ error: "Invalid credentials" }, { status: 401, headers: CORS });
      }

      const isValid = await bcrypt.compare(parsed.data.password, user.password);
      if (!isValid) {
        return Response.json({ error: "Invalid credentials" }, { status: 401, headers: CORS });
      }

      if (user.role !== "STUDENT") {
        return Response.json(
          { error: "Guild staff must sign in from the Guild Master portal" },
          { status: 403, headers: CORS },
        );
      }

      const token = await new SignJWT({ userId: user.id, role: user.role })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecret());

      return Response.json(
        {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        },
        { headers: CORS },
      );
    } catch (err) {
      console.error("[/api/auth/login]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS });
    }
  },
});
