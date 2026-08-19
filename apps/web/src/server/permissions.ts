import { prisma } from "./db";
import { getCurrentUserFn } from "./auth";

export type StaffPermission =
  | "courses"
  | "categories"
  | "quizzes"
  | "certificates"
  | "support"
  | "users"
  | "roles"
  | "payments"
  | "refunds"
  | "reviews"
  | "cms"
  | "settings"
  | "stats";

// Middleware to ensure user has specific permission
export async function ensurePermission(permission: StaffPermission) {
  const user = await getCurrentUserFn();
  if (!user) {
    throw new Error("Unauthorized: Login required");
  }

  if (user.role === "ADMIN") return user;

  if (user.role === "MANAGER") {
    if (
      permission === "courses" ||
      permission === "categories" ||
      permission === "quizzes" ||
      permission === "certificates" ||
      permission === "users" ||
      permission === "reviews" ||
      permission === "stats"
    ) {
      return user;
    }
  }

  if (user.role === "TECHNICAL_TEAM") {
    if (permission === "support" || permission === "stats") {
      return user;
    }
  }

  throw new Error(`Unauthorized: Missing '${permission}' permission for role ${user.role}`);
}

// Middleware to ensure user is super admin
export async function ensureAdmin() {
  const user = await getCurrentUserFn();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}
