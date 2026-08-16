import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enrollUser(userId: string, courseId: string) {
    // Check if user already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("User already enrolled in this course");
    }

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new BadRequestException("Course not found");
    }

    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        enrolledAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return {
      message: "Successfully enrolled in course",
      enrollment,
    };
  }

  async getUserEnrollments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: {
              select: { id: true, duration: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    const lessonIds = enrollments.flatMap(({ course }) => course.lessons.map((l) => l.id));

    const progressRows = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, progressSeconds: true, completed: true },
    });
    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

    const formattedEnrollments = enrollments.map((enrollment) => {
      const { course } = enrollment;
      const lessons = course.lessons;
      const { lessons: _lessons, ...rest } = course;
      const total = lessons.length;
      const completed = lessons.filter((l) => progressByLesson.get(l.id)?.completed).length;

      const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
      const watchedDuration = lessons.reduce((sum, l) => {
        const p = progressByLesson.get(l.id);
        if (p?.completed) return sum + (l.duration || 0);
        return sum + Math.min(p?.progressSeconds || 0, l.duration || 0);
      }, 0);

      let progress = 0;
      if (totalDuration > 0) {
        progress = Math.round((watchedDuration / totalDuration) * 100);
      }
      if (total > 0) {
        progress = Math.max(progress, Math.round((completed / total) * 100));
      }

      const expired = !!enrollment.expiresAt && enrollment.expiresAt.getTime() <= Date.now();

      return {
        ...rest,
        totalLessons: total,
        completedLessons: completed,
        progress: Math.min(progress, 100),
        expiresAt: enrollment.expiresAt,
        expired,
      };
    });

    return { enrollments: formattedEnrollments };
  }

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return !!enrollment;
  }
}
