import { createAPIFileRoute } from "../_helpers";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
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

export const APIRoute = createAPIFileRoute("/api/auth/signup")({
  OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const parsed = signupSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400, headers: CORS },
        );
      }

      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });
      if (existing) {
        return Response.json({ error: "Email already registered" }, { status: 409, headers: CORS });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 10);
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: passwordHash,
          role: "STUDENT",
        },
      });

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
        { status: 201, headers: CORS },
      );
    } catch (err) {
      console.error("[/api/auth/signup]", err);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS });
    }
  },
});
