import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastStudyDate: true },
    });

    let userStreak = user?.currentStreak || 0;
    if (user?.lastStudyDate) {
      const now = new Date();
      const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = `${yesterday.getUTCFullYear()}-${yesterday.getUTCMonth() + 1}-${yesterday.getUTCDate()}`;

      const d = new Date(user.lastStudyDate);
      const lastDateStr = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;

      if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
        userStreak = 0;
      }
    } else {
      userStreak = 0;
    }

    const longestStreak = Math.max(user?.longestStreak || 0, userStreak);
    const mpPercent = Math.min(100, Math.max(0, Math.round((userStreak / 7) * 100)));

    return {
      rankLetter: currentRank.letter,
      rankName: currentRank.name,
      expTotal: totalExp,
      expCurrent: Math.min(expCurrent, expMax),
      expMax,
      focusPct,
      mpPercent: mpPercent > 0 ? mpPercent : Math.min(100, Math.max(0, focusPct)),
      streak: userStreak,
      longestStreak,
      coursesTaken: courseIds.length,
      coursesCompleted: completedCourses,
      lessonsCompleted: completedLessons,
    };
  }

  async updateProgress(
    userId: string,
    data: { lessonId: string; watchedSeconds: number; duration?: number; completed?: boolean },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: { course: true },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");

    // Verify active course enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
    });

    const isExpired =
      enrollment?.expiresAt && enrollment.expiresAt.getTime() <= Date.now();

    if (!enrollment || isExpired) {
      throw new ForbiddenException(
        "Active course enrollment required to save lesson progress",
      );
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: data.lessonId,
        },
      },
    });

    const progressSeconds = Math.max(
      existing ? existing.progressSeconds : 0,
      Math.round(data.watchedSeconds),
    );
    const duration = data.duration || lesson.duration || 0;
    const threshold = duration > 0 ? Math.ceil(duration * 0.9) : 0;
    const isCompleted =
      data.completed === true ||
      existing?.completed === true ||
      (threshold > 0 && progressSeconds >= threshold);

    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: data.lessonId,
        },
      },
      update: {
        progressSeconds,
        completed: isCompleted,
        completedAt: isCompleted && !existing?.completed ? new Date() : undefined,
      },
      create: {
        userId,
        lessonId: data.lessonId,
        progressSeconds,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Update study streak
    await this.updateUserStreak(userId);

    // Check if course 100% complete -> issue certificate & notify
    if (isCompleted && lesson.courseId) {
      const totalLessons = await this.prisma.lesson.count({
        where: { courseId: lesson.courseId },
      });
      const completedCount = await this.prisma.lessonProgress.count({
        where: {
          userId,
          completed: true,
          lesson: { courseId: lesson.courseId },
        },
      });

      if (totalLessons > 0 && completedCount >= totalLessons) {
        const cert = await this.prisma.certificate.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: lesson.courseId,
            },
          },
        });

        if (!cert) {
          await this.prisma.certificate.create({
            data: {
              userId,
              courseId: lesson.courseId,
            },
          });

          await this.prisma.notification.create({
            data: {
              userId,
              title: "🏆 Official Certificate Awarded!",
              message: `Congratulations! You conquered all lessons in "${lesson.course.title}" and earned your verified Certificate!`,
              type: "CERTIFICATE_EARNED",
              data: { courseId: lesson.courseId },
            },
          });
        }
      }
    }

    return { success: true };
  }

  async updateUserStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastStudyDate: true },
    });
    if (!user) return;

    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

    let newStreak = user.currentStreak || 0;
    let lastDateStr: string | null = null;
    if (user.lastStudyDate) {
      const d = new Date(user.lastStudyDate);
      lastDateStr = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
    }

    if (!lastDateStr) {
      newStreak = 1;
    } else if (lastDateStr === todayStr) {
      return { currentStreak: newStreak, longestStreak: user.longestStreak || newStreak };
    } else {
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = `${yesterday.getUTCFullYear()}-${yesterday.getUTCMonth() + 1}-${yesterday.getUTCDate()}`;

      if (lastDateStr === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastStudyDate: now,
      },
    });

    return { currentStreak: newStreak, longestStreak };
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
