import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";
import { ensurePermission } from "./permissions";

// ---------------- ADMIN / MANAGER TEMPLATE OPERATIONS ----------------

export const getCertificateTemplatesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensurePermission("certificates");

  const [templates, courses] = await Promise.all([
    prisma.certificateTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return { templates, courses };
});

export const saveCertificateTemplateFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, "Title is required"),
      imageUrl: z.string().optional().nullable(),
      signatoryName: z.string().default("Director of Cyber Tech Academy"),
      signatoryTitle: z.string().default("Chief Instructor & Guildmaster"),
      signatureUrl: z.string().optional().nullable(),
      sealUrl: z.string().optional().nullable(),
      isDefault: z.boolean().default(false),
      courseId: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await ensurePermission("certificates");

    // If this template is set to default, unset other defaults
    if (data.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { id: { not: data.id || "" } },
        data: { isDefault: false },
      });
    }

    if (data.id) {
      const updated = await prisma.certificateTemplate.update({
        where: { id: data.id },
        data: {
          title: data.title,
          imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
          signatoryName: data.signatoryName || "Director of Cyber Tech Academy",
          signatoryTitle: data.signatoryTitle || "Chief Instructor & Guildmaster",
          signatureUrl: data.signatureUrl?.trim() ? data.signatureUrl.trim() : null,
          sealUrl: data.sealUrl?.trim() ? data.sealUrl.trim() : null,
          isDefault: data.isDefault,
          courseId: data.courseId?.trim() ? data.courseId.trim() : null,
        },
      });
      return updated;
    }

    const created = await prisma.certificateTemplate.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
        signatoryName: data.signatoryName || "Director of Cyber Tech Academy",
        signatoryTitle: data.signatoryTitle || "Chief Instructor & Guildmaster",
        signatureUrl: data.signatureUrl?.trim() ? data.signatureUrl.trim() : null,
        sealUrl: data.sealUrl?.trim() ? data.sealUrl.trim() : null,
        isDefault: data.isDefault,
        courseId: data.courseId?.trim() ? data.courseId.trim() : null,
      },
    });

    return created;
  });

export const deleteCertificateTemplateFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensurePermission("certificates");
    await prisma.certificateTemplate.delete({ where: { id: data.id } });
    return { success: true };
  });

export const getAdminIssuedCertificatesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensurePermission("certificates");

  const [certificates, totalCount] = await Promise.all([
    prisma.certificate.findMany({
      orderBy: { issueDate: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.certificate.count(),
  ]);

  return { certificates, totalCount };
});

// ---------------- STUDENT ISSUANCE & VERIFICATION ----------------

export const issueOrGetCertificateFn = createServerFn({ method: "POST" })
  .validator(z.object({ courseId: z.string() }))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Please log in to view your certificate");

    // Resolve course by id or slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: data.courseId }, { slug: data.courseId }],
      },
      include: {
        lessons: { select: { id: true } },
        category: { select: { name: true } },
      },
    });

    if (!course) throw new Error("Course not found");

    // Check if enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });

    if (!enrollment && user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw new Error("You must be enrolled in this course to claim a certificate");
    }

    // Check 100% completion of lessons
    if (course.lessons.length > 0 && user.role === "STUDENT") {
      const completedCount = await prisma.lessonProgress.count({
        where: {
          userId: user.id,
          lessonId: { in: course.lessons.map((l) => l.id) },
          completed: true,
        },
      });

      if (completedCount < course.lessons.length) {
        throw new Error(
          `Course incomplete (${completedCount}/${course.lessons.length} lessons finished). Complete all lessons to unlock your certificate.`,
        );
      }
    }

    // Find or create certificate
    let certificate = await prisma.certificate.findUnique({
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
      certificate = await prisma.certificate.create({
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

    // Get specific template for course or default template
    const template = await prisma.certificateTemplate.findFirst({
      where: {
        OR: [{ courseId: course.id }, { isDefault: true }],
      },
      orderBy: { courseId: "asc" },
    });

    return {
      certificate,
      template,
      user,
    };
  });

export const getCertificateDetailsFn = createServerFn({ method: "GET" })
  .validator(z.object({ certificateNo: z.string() }))
  .handler(async ({ data }) => {
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ certificateNo: data.certificateNo }, { id: data.certificateNo }],
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

    if (!certificate) throw new Error("Certificate not found");

    const template = await prisma.certificateTemplate.findFirst({
      where: {
        OR: [{ courseId: certificate.courseId }, { isDefault: true }],
      },
      orderBy: { courseId: "asc" },
    });

    return { certificate, template };
  });

export const getUserCertificatesFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) return { certificates: [] };

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issueDate: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  return { certificates };
});
