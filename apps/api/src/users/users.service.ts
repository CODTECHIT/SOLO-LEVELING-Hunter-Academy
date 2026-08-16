import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getUserEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            _count: {
              select: { lessons: true },
            },
          },
        },
      },
    });
  }

  async getUserLearningProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    const progress = await this.prisma.lessonProgress.groupBy({
      by: ["userId"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    return {
      enrolledCourses: courseIds.length,
      lessonsCompleted: progress[0]?._count?.id || 0,
    };
  }

  async getHunterStats(userId: string) {
    const ranks = [
      { letter: "E", name: "Novice Hunter", floor: 0, next: 1000 },
      { letter: "D", name: "Initiate Hunter", floor: 1000, next: 3000 },
      { letter: "C", name: "Adept Hunter", floor: 3000, next: 7000 },
      { letter: "B", name: "Elite Hunter", floor: 7000, next: 15000 },
      { letter: "A", name: "Veteran Hunter", floor: 15000, next: 30000 },
      { letter: "S", name: "Legendary Hunter", floor: 30000, next: null },
    ];

    // Get enrollments and their courses
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            lessons: {
              select: { id: true, duration: true },
            },
          },
        },
      },
    });

    const courseIds = enrollments.map((e) => e.courseId);
    const allLessonIds = enrollments.flatMap((e) =>
      e.course.lessons.map((l) => l.id),
    );

    // Get lesson progress
    const lessonProgress = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: allLessonIds } },
      select: { lessonId: true, progressSeconds: true, completed: true },
    });

    const progressMap = new Map(lessonProgress.map((p) => [p.lessonId, p]));

    // Calculate stats
    let totalExp = 0;
    let completedLessons = 0;
    let completedCourses = 0;
    let totalDuration = 0;
    let watchedDuration = 0;

    for (const enrollment of enrollments) {
      totalExp += 50; // 50 XP per course taken

      const lessons = enrollment.course.lessons;
      const lessonCompleted = lessons.filter(
        (l) => progressMap.get(l.id)?.completed,
      ).length;
      completedLessons += lessonCompleted;

      if (lessonCompleted === lessons.length && lessons.length > 0) {
        completedCourses += 1;
        totalExp += 200; // 200 XP per course completed
      }

      totalExp += lessonCompleted * 25; // 25 XP per lesson completed

      for (const lesson of lessons) {
        totalDuration += lesson.duration || 0;
        const progress = progressMap.get(lesson.id);
        if (progress?.completed) {
          watchedDuration += lesson.duration || 0;
        } else {
          watchedDuration += Math.min(
            progress?.progressSeconds || 0,
            lesson.duration || 0,
          );
        }
      }
    }

    const focusPct =
      totalDuration > 0
        ? Math.round((watchedDuration / totalDuration) * 100)
        : 0;

    // Find current rank
    let rankIndex = 0;
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (totalExp >= ranks[i].floor) {
        rankIndex = i;
        break;
      }
    }

    const currentRank = ranks[rankIndex];
    const nextRank = rankIndex < ranks.length - 1 ? ranks[rankIndex + 1] : null;
    const expCurrent = totalExp - currentRank.floor;
    const expMax = nextRank ? nextRank.floor - currentRank.floor : 10000;

    return {
      rankLetter: currentRank.letter,
      rankName: currentRank.name,
      expTotal: totalExp,
      expCurrent: Math.min(expCurrent, expMax),
      expMax,
      focusPct,
      mpPercent: Math.min(100, Math.max(0, focusPct)),
      streak: 0, // Simplified for now
      coursesTaken: courseIds.length,
      coursesCompleted: completedCourses,
      lessonsCompleted: completedLessons,
    };
  }

  async getUserPurchases(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { title: true },
        },
      },
    });

    return payments.map(p => ({
      ...p,
      courseTitle: p.course?.title || "Unknown Course"
    }));
  }

  async getUserRefunds(userId: string) {
    const refunds = await this.prisma.refund.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          include: {
            course: { select: { title: true } }
          }
        }
      }
    });

    return refunds.map(r => ({
      ...r,
      courseTitle: r.payment?.course?.title || "Unknown Course",
      amount: r.payment?.amount || 0
    }));
  }

  async requestRefund(userId: string, data: { paymentId: string, reason: string }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!payment || payment.userId !== userId) {
      throw new Error("Payment not found or not authorized");
    }

    const existing = await this.prisma.refund.findFirst({
      where: { paymentId: data.paymentId, status: "PENDING" },
    });

    if (existing) {
      throw new Error("A refund request for this purchase is already pending");
    }

    return this.prisma.refund.create({
      data: {
        userId,
        paymentId: data.paymentId,
        reason: data.reason,
        status: "PENDING",
      },
    });
  }
}
