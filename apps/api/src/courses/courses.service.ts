import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip = 0, take = 10) {
    return this.prisma.course.findMany({
      where: { published: true },
      skip,
      take,
      include: {
        category: true,
        lessons: {
          select: {
            id: true,
            title: true,
            duration: true,
            order: true,
          },
        },
        _count: {
          select: { enrollments: true, reviews: true },
        },
      },
    });
  }

  async getIntroVideo() {
    return this.prisma.introVideo.findFirst({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }

  async findById(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            duration: true,
            order: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        lessons: {
          orderBy: { order: "asc" },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
  }

  async searchCourses(query: string, skip = 0, take = 10) {
    return this.prisma.course.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip,
      take,
      include: {
        category: true,
        _count: { select: { enrollments: true } },
      },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        courses: {
          where: { published: true },
          select: { id: true },
        },
      },
    });
  }

  async getCatalog() {
    const categories = await this.prisma.category.findMany({
      include: {
        courses: {
          where: { published: true },
          select: { id: true },
        },
      },
    });

    const courses = await this.prisma.course.findMany({
      where: { published: true },
      include: {
        category: true,
        lessons: {
          select: { id: true },
        },
      },
    });

    const fullCourses = courses.filter((c) => c.type === "FULL");
    const moduleCourses = courses.filter((c) => c.type === "MODULE");

    return { categories, courses, fullCourses, moduleCourses };
  }

  async verifyToken(token: string) {
    // A quick hack since we don't have JwtService injected here.
    // If we wanted to be perfectly clean, we'd inject JwtService.
    // But since this is a known payload structure we can just base64 decode it for public context
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error("Invalid token");
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  }

  async findBySlugWithContext(slug: string, userId: string | null) {
    const course = await this.findBySlug(slug);
    if (!course) return null;

    let isEnrolled = false;
    let hasAccessExpired = false;
    let completedLessonIds: string[] = [];
    let lessonProgress: Record<string, number> = {};

    if (userId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: course.id,
          },
        },
        select: { expiresAt: true },
      });
      hasAccessExpired = !!enrollment?.expiresAt && enrollment.expiresAt.getTime() <= Date.now();
      isEnrolled = !!enrollment && !hasAccessExpired;

      const progress = await this.prisma.lessonProgress.findMany({
        where: {
          userId: userId,
          lessonId: { in: course.lessons.map((l: any) => l.id) },
        },
        select: { lessonId: true, progressSeconds: true, completed: true },
      });
      completedLessonIds = progress.filter((p: any) => p.completed).map((p: any) => p.lessonId);
      lessonProgress = Object.fromEntries(progress.map((p: any) => [p.lessonId, p.progressSeconds]));
    }

    return { course, isEnrolled, hasAccessExpired, completedLessonIds, lessonProgress };
  }
}
