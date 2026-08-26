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
const DEV_FALLBACK_SECRET = "your-secret-key-change-in-production";

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

async function issueSessionToken(user: { id: string; email: string; role: string }) {
  const token = await new SignJWT({
    sub: user.id,
    userId: user.id,
    email: user.email,
    role: user.role,
  })
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

  return token;
}

export const loginUserFn = createServerFn({ method: "POST" })
  .validator((data) => parseZod(loginSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials: User not found");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials: Incorrect password");
    }

    // Strict separation: Staff must log in via /admin/academy/login only
    if (
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "TECHNICAL_TEAM" ||
      user.customRoleId
    ) {
      throw new Error(
        "Staff account detected. Please log in via the Administrative Hub at /admin/academy/login"
      );
    }

    const token = await issueSessionToken(user);

    return { success: true, role: user.role, token };
  });

export const loginAdminFn = createServerFn({ method: "POST" })
  .validator((data) => parseZod(loginSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials: User not found");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials: Incorrect password");
    }

    // Allow strictly ADMIN, MANAGER, TECHNICAL_TEAM, or custom staff role
    const isStaff =
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "TECHNICAL_TEAM" ||
      Boolean(user.customRoleId);

    if (!isStaff || user.role === "STUDENT") {
      throw new Error("Unauthorized: Staff access only. Students must log in at /login");
    }

    const token = await issueSessionToken(user);

    return { success: true, role: user.role, token };
  });


const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
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
        phone: data.phone || null,
        role: "STUDENT",
      },
    });

    const token = await issueSessionToken(user);

    return { success: true, token, role: user.role };
  });

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie("auth_token");
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = (payload.userId as string) || (payload.sub as string);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        customRoleId: true,
      },
    });

    return user;
  } catch {
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
  setCookie("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return { success: true };
});

const syncOAuthSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  accessToken: z.string().min(1, "Access token is required"),
});

export const syncSupabaseOAuthUserFn = createServerFn({ method: "POST" })
  .validator((data) => parseZod(syncOAuthSchema.safeParse(data)))
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const { accessToken } = data;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
          },
        });

        if (!response.ok) {
          throw new Error("Invalid OAuth session token");
        }

        const supabaseUser: any = await response.json();
        const verifiedEmail = supabaseUser?.email?.trim().toLowerCase();

        if (!verifiedEmail || verifiedEmail !== normalizedEmail) {
          throw new Error("Token identity does not match requested email address");
        }
      } catch (err: any) {
        throw new Error(err.message || "Failed to verify OAuth identity");
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("OAuth provider configuration is missing in production");
    }

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: data.name || "Hunter",
          password: randomPassword,
          role: "STUDENT",
        },
      });
    }

    const token = await issueSessionToken(user);

    return { success: true, role: user.role, token };
  });

