import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'
import { z } from 'zod'
import { getCurrentUserFn } from './auth'

export const getCatalogFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const categories = await prisma.category.findMany({
      include: {
        courses: {
          where: { published: true }
        }
      }
    })
    
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        category: true,
        lessons: {
          select: { id: true }
        }
      }
    })

    return { categories, courses }
  })

export const getCourseFn = createServerFn({ method: 'GET' })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const course = await prisma.course.findUnique({
      where: { slug: data.slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        },
        category: true
      }
    })
    
    if (!course) {
      throw new Error("Course not found")
    }

    // Check enrollment if logged in
    const user = await getCurrentUserFn()
    let isEnrolled = false
    let completedLessonIds: string[] = []
    
    if (user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id
          }
        }
      })
      isEnrolled = !!enrollment

      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          completed: true,
          lessonId: { in: course.lessons.map(l => l.id) }
        },
        select: { lessonId: true }
      })
      completedLessonIds = progress.map(p => p.lessonId)
    }

    return { course, isEnrolled, completedLessonIds }
  })

export const enrollUserFn = createServerFn({ method: 'POST' })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user) throw new Error("Must be logged in to enroll")

    // Mock bypass: Instantly enroll without payment verification
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: data.courseId
      }
    })

    return { success: true }
  })

export const markLessonCompletedFn = createServerFn({ method: 'POST' })
  .validator((data: { lessonId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user) throw new Error("Must be logged in")

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: data.lessonId
        }
      },
      update: {
        completed: true,
        completedAt: new Date()
      },
      create: {
        userId: user.id,
        lessonId: data.lessonId,
        completed: true,
        completedAt: new Date()
      }
    })

    return { success: true }
  })

export const getEnrolledCoursesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getCurrentUserFn()
    if (!user) return []

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            lessons: true
          }
        }
      }
    })

    return enrollments.map(e => e.course)
  })

export const getPurchasesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getCurrentUserFn()
    if (!user) return []

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    
    // Also fetch courses for these payments
    const courseIds = payments.map(p => p.courseId)
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true }
    })

    return payments.map(p => ({
      ...p,
      courseTitle: courses.find(c => c.id === p.courseId)?.title || "Unknown Course"
    }))
  })

const refundSchema = z.object({
  paymentId: z.string(),
  reason: z.string().min(10)
})

export const submitRefundFn = createServerFn({ method: 'POST' })
  .validator((data) => refundSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user) throw new Error("Must be logged in")

    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId }
    })

    if (!payment || payment.userId !== user.id) {
      throw new Error("Payment not found or not authorized")
    }

    const refund = await prisma.refund.create({
      data: {
        userId: user.id,
        paymentId: data.paymentId,
        reason: data.reason,
        status: "PENDING"
      }
    })

    return { success: true, refund }
  })

export const getRefundsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getCurrentUserFn()
    if (!user) return []

    const refunds = await prisma.refund.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const paymentIds = refunds.map(r => r.paymentId)
    const payments = await prisma.payment.findMany({
      where: { id: { in: paymentIds } }
    })

    const courseIds = payments.map(p => p.courseId)
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true }
    })

    return refunds.map(r => {
      const payment = payments.find(p => p.id === r.paymentId)
      const courseTitle = payment 
        ? courses.find(c => c.id === payment.courseId)?.title 
        : "Unknown Course"
      return {
        ...r,
        courseTitle: courseTitle || "Unknown Course"
      }
    })
  })

const reviewSchema = z.object({
  courseId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})

export const submitReviewFn = createServerFn({ method: 'POST' })
  .validator((data) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user) throw new Error("Must be logged in")

    // Check if enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId
        }
      }
    })

    if (!enrollment) {
      throw new Error("Must be enrolled to review")
    }

    await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: data.courseId
        }
      },
      update: {
        rating: data.rating,
        comment: data.comment
      },
      create: {
        userId: user.id,
        courseId: data.courseId,
        rating: data.rating,
        comment: data.comment
      }
    })

    return { success: true }
  })

export const getCourseReviewsFn = createServerFn({ method: 'GET' })
  .validator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const reviews = await prisma.review.findMany({
      where: { courseId: data.courseId },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return reviews
  })
