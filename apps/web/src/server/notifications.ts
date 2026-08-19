import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { getCurrentUserFn } from "./auth";
import { z } from "zod";

export type NotificationType =
  | "NEW_COURSE"
  | "COURSE_PURCHASED"
  | "SUPPORT_REPLY"
  | "CERTIFICATE_EARNED"
  | "STREAK_ACHIEVED";

/**
 * Server-side helper to record a notification for a user or broadcast
 */
export async function createNotification(params: {
  userId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId ?? null,
        title: params.title,
        message: params.message,
        type: params.type,
        data: params.data ?? undefined,
        read: false,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

/**
 * Fetch all notifications for the logged-in student (personal + global broadcasts)
 */
export const getNotificationsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      return { notifications: [], unreadCount: 0 };
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId: user.id }, { userId: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount };
  },
);

/**
 * Mark a single notification as read
 */
export const markNotificationReadFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Unauthorized");

    await prisma.notification.updateMany({
      where: {
        id: data.id,
        OR: [{ userId: user.id }, { userId: null }],
      },
      data: { read: true },
    });

    return { success: true };
  });

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsReadFn = createServerFn({
  method: "POST",
}).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: {
      OR: [{ userId: user.id }, { userId: null }],
    },
    data: { read: true },
  });

  return { success: true };
});
