import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(params: {
    userId?: string | null;
    title: string;
    message: string;
    type: string;
    data?: any;
  }) {
    try {
      return await this.prisma.notification.create({
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

  async getUserNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: {
        id,
        OR: [{ userId }, { userId: null }],
      },
      data: { read: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      data: { read: true },
    });
    return { success: true };
  }
}
