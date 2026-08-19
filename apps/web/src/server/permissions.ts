import { prisma } from "./db";
import { getCurrentUserFn } from "./auth";

export type StaffPermission =
  | "courses"
  | "categories"
  | "quizzes"
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
      permission === "cms" ||
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

  if (user.customRoleId) {
    const customRole = await prisma.customRole.findUnique({
      where: { id: user.customRoleId },
    });
    const perms = customRole?.permissions as Record<string, boolean> | null;
    if (perms && (perms[permission] === true || perms.all === true)) {
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
