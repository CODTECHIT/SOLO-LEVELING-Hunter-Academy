import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { z } from "zod";
import { getCurrentUserFn } from "./auth";
import { getPresignedUploadUrl, uploadBufferToS3 } from "./s3";

async function ensureAdmin() {
  const user = await getCurrentUserFn();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

// ---------- CMS Pages ----------

export const getCmsPagesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();
  const pages = await prisma.cmsPage.findMany({ orderBy: { slug: "asc" } });
  return { pages };
});

export const saveCmsPageFn = createServerFn({ method: "POST" })
  .validator(z.object({ slug: z.string().min(1), title: z.string().min(1), content: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();

    const page = await prisma.cmsPage.upsert({
      where: { slug: data.slug },
      update: { title: data.title, content: data.content },
      create: { slug: data.slug, title: data.title, content: data.content },
    });
    return page;
  });

// ---------- FAQ ----------

export const getFaqItemsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();
  const faqs = await prisma.faqItem.findMany({
    where: { courseId: null },
    orderBy: { order: "asc" },
  });
  return { faqs };
});

export const getCourseFaqsFn = createServerFn({ method: "GET" })
  .validator(z.object({ courseId: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    const faqs = await prisma.faqItem.findMany({
      where: { courseId: data.courseId },
      orderBy: { order: "asc" },
    });
    return { faqs };
  });

export const saveFaqItemFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      question: z.string().min(1),
      answer: z.string().min(1),
      order: z.number().optional(),
      courseId: z.string().nullish(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    if (data.id) {
      return await prisma.faqItem.update({
        where: { id: data.id },
        data: {
          question: data.question,
          answer: data.answer,
          order: data.order ?? 0,
          courseId: data.courseId ?? null,
        },
      });
    }

    const maxOrder = await prisma.faqItem.aggregate({ _max: { order: true } });
    return await prisma.faqItem.create({
      data: {
        question: data.question,
        answer: data.answer,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1,
        courseId: data.courseId ?? null,
      },
    });
  });

export const deleteFaqItemFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    await prisma.faqItem.delete({ where: { id: data.id } });
    return { success: true };
  });

// ---------- Sliders / Banners ----------

export const getSlidersFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();
  const sliders = await prisma.slider.findMany({ orderBy: { order: "asc" } });
  return { sliders };
});

export const saveSliderFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      imageUrl: z.string().optional(),
      linkUrl: z.string().optional(),
      active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    if (data.id) {
      return await prisma.slider.update({
        where: { id: data.id },
        data: {
          title: data.title,
          subtitle: data.subtitle ?? null,
          imageUrl: data.imageUrl ?? null,
          linkUrl: data.linkUrl ?? null,
          active: data.active ?? true,
        },
      });
    }

    const maxOrder = await prisma.slider.aggregate({ _max: { order: true } });
    return await prisma.slider.create({
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        imageUrl: data.imageUrl ?? null,
        linkUrl: data.linkUrl ?? null,
        active: data.active ?? true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
  });

export const deleteSliderFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    await prisma.slider.delete({ where: { id: data.id } });
    return { success: true };
  });

// ---------- Intro Videos ----------

export const getIntroVideosFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();
  const videos = await prisma.introVideo.findMany({ orderBy: { order: "asc" } });
  return { videos };
});

export const getActiveIntroVideoFn = createServerFn({ method: "GET" }).handler(async () => {
  const video = await prisma.introVideo.findFirst({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return { video };
});

export const saveIntroVideoFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      videoUrl: z.string().url(),
      thumbnail: z.string().optional(),
      active: z.boolean().optional(),
      order: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();

    if (data.id) {
      return await prisma.introVideo.update({
        where: { id: data.id },
        data: {
          title: data.title,
          videoUrl: data.videoUrl,
          thumbnail: data.thumbnail ?? null,
          active: data.active ?? true,
          order: data.order,
        },
      });
    }

    const maxOrder = await prisma.introVideo.aggregate({ _max: { order: true } });
    return await prisma.introVideo.create({
      data: {
        title: data.title,
        videoUrl: data.videoUrl,
        thumbnail: data.thumbnail ?? null,
        active: data.active ?? true,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
  });

export const deleteIntroVideoFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureAdmin();
    await prisma.introVideo.delete({ where: { id: data.id } });
    return { success: true };
  });

export const getPresignedUrlFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      filename: z.string().min(1),
      contentType: z.string().min(1),
      folder: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const ext = data.filename.split(".").pop() || "file";
    const folderName = data.folder || "intro-videos";
    const key = `${folderName}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadUrl = await getPresignedUploadUrl(key, data.contentType);

    const bucket = process.env.AWS_S3_BUCKET_NAME || "";
    const region = process.env.AWS_REGION || "ap-south-1";
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { uploadUrl, publicUrl };
  });

export const uploadFileToS3Fn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      filename: z.string().min(1),
      base64Data: z.string().min(1),
      contentType: z.string().min(1),
      folder: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureAdmin();
    const ext = data.filename.split(".").pop() || "file";
    const folderName = data.folder || "intro-videos";
    const key = `${folderName}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const buffer = Buffer.from(data.base64Data, "base64");
    const publicUrl = await uploadBufferToS3(key, buffer, data.contentType);

    return { publicUrl };
  });

// ---------- Settings ----------

export const getSiteSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureAdmin();
  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return { settings };
});

export const saveSiteSettingsFn = createServerFn({ method: "POST" })
  .validator(z.record(z.string(), z.string()))
  .handler(async ({ data }) => {
    await ensureAdmin();

    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return { success: true };
  });
