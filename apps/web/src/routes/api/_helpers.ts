/**
 * Shared helper: verify a Bearer token from the Authorization header.
 * Returns { userId, role } or throws a Response on error.
 * Used only by the mobile REST API routes — web still uses httpOnly cookie auth.
 */
import { jwtVerify } from "jose";

export type APIHandler = {
  [method: string]: (ctx: { request: Request; params?: any }) => Promise<Response> | Response;
};

export function createAPIFileRoute(_path: string) {
  return (handler: APIHandler) => handler;
}


function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "solo-leveling-secret-key-123");
  if (!secret) throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(secret);
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function verifyBearerToken(
  request: Request,
): Promise<{ userId: string; role: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.userId || !payload.role) {
      throw new Error("Invalid token payload");
    }
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    throw Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }
}
