import { createServerFn } from "@tanstack/react-start";
import { setCookie, getCookie } from "@tanstack/react-start/server";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

// The fallback key is committed to the repo, so it must never be used in
// production: anyone who knows it can forge auth tokens for any userId (full
// account takeover via getCurrentUserFn). In production a missing JWT_SECRET
// must fail loudly instead of silently signing with the public key.
const DEV_FALLBACK_SECRET = "solo-leveling-secret-key-123";

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : DEV_FALLBACK_SECRET);
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  return new TextEncoder().encode(secret);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function parseZod<T>(res: z.SafeParseReturnType<any, T>): T {
  if (!res.success) {
    const issue = res.error.issues[0];
    const field = issue.path.join(".") || "input";
    const msg = issue.message;
    throw new Error(msg === "Required" ? `${field} is required` : msg);
  }
  return res.data;
}

async function issueSessionToken(user: { id: string; role: string }) {
  const token = await new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  setCookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export const loginUserFn = createServerFn({ method: "POST" })
  .validator((data) => parseZod(loginSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // The user portal is for hunters only. Guild staff (ADMIN/SUB_ADMIN)
    // must sign in through the Guild Master portal.
    if (user.role !== "STUDENT") {
      throw new Error("Guild staff must sign in from the Guild Master portal");
    }

    await issueSessionToken(user);

    return { success: true };
  });

export const loginAdminFn = createServerFn({ method: "POST" })
  .validator((data) => parseZod(loginSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Only Guild Masters can enter the admin sector.
    if (user.role !== "ADMIN") {
      throw new Error("Unauthorized: Guild Master access only");
    }

    await issueSessionToken(user);

    return { success: true };
  });

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerUserFn = createServerFn({ method: "POST" })
  .validator((data) => parseZod(registerSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: "STUDENT",
      },
    });

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecret());

    setCookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  });

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie("auth_token");
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    return user;
  } catch (e) {
    return null;
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const updateProfileFn = createServerFn({ method: "POST" })
  .validator((data) => updateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Not logged in");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
      },
    });

    return { success: true };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  setCookie("auth_token", "", { maxAge: 0, path: "/" });
  return { success: true };
});

const syncSupabaseOAuthSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

export const syncSupabaseOAuthUserFn = createServerFn({ method: "POST" })
  .validator((data) => syncSupabaseOAuthSchema.parse(data))
  .handler(async ({ data }) => {
    let user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: randomPassword,
          role: "STUDENT",
        },
      });
    }

    // Guild staff must never authenticate through the user-side OAuth flow.
    if (user.role !== "STUDENT") {
      throw new Error("Guild staff accounts cannot sign in on the user portal");
    }

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecret());

    setCookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  });
