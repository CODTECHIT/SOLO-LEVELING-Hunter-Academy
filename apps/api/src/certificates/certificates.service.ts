import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async getCertificateForCourse(userId: string, courseIdOrSlug: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      },
      include: {
        lessons: { select: { id: true } },
        category: { select: { name: true } },
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });

    if (!enrollment && user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw new BadRequestException(
        "You must be enrolled in this course to claim a certificate",
      );
    }

    // Check 100% completion for students
    if (course.lessons.length > 0 && user.role === "STUDENT") {
      const completedCount = await this.prisma.lessonProgress.count({
        where: {
          userId: user.id,
          lessonId: { in: course.lessons.map((l) => l.id) },
          completed: true,
        },
      });

      if (completedCount < course.lessons.length) {
        throw new BadRequestException(
          `Course incomplete (${completedCount}/${course.lessons.length} lessons finished). Complete all lessons to unlock your certificate.`,
        );
      }
    }

    // Find or create certificate record
    let certificate = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      const certNo = `CTA-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      certificate = await this.prisma.certificate.create({
        data: {
          certificateNo: certNo,
          userId: user.id,
          courseId: course.id,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: { select: { name: true } },
            },
          },
        },
      });
    }

    // 1. Get specific template for course, or fallback to default template
    let template = await this.prisma.certificateTemplate.findFirst({
      where: { courseId: course.id },
    });
    if (!template) {
      template = await this.prisma.certificateTemplate.findFirst({
        where: { isDefault: true },
      });
    }

    return {
      certificate,
      template: template || {
        title: "Official Guild Certificate of Mastery",
        imageUrl: null,
        signatoryName: "Director of Cyber Tech Academy",
        signatoryTitle: "Chief Instructor & Guildmaster",
        signatureUrl: null,
        sealUrl: null,
      },
      user,
    };
  }

  async verifyCertificate(certificateNo: string) {
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        OR: [{ certificateNo }, { id: certificateNo }],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException("Certificate not found or invalid");
    }

    // 1. Get specific template for course, or fallback to default template
    let template = await this.prisma.certificateTemplate.findFirst({
      where: { courseId: certificate.courseId },
    });
    if (!template) {
      template = await this.prisma.certificateTemplate.findFirst({
        where: { isDefault: true },
      });
    }

    return {
      certificate,
      template,
      isValid: true,
    };
  }
}
