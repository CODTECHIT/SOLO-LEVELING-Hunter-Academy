import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'
import { z } from 'zod'
import { getCurrentUserFn } from './auth'

// Middleware to ensure user is admin
async function ensureAdmin() {
  const user = await getCurrentUserFn()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  return user
}

export const promoteToAdminFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const user = await getCurrentUserFn()
    if (!user) throw new Error('Must be logged in to promote')

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    })

    return { success: true }
  })

export const getAdminStatsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await ensureAdmin()

    const totalUsers = await prisma.user.count()
    const totalCourses = await prisma.course.count()
    const totalEnrollments = await prisma.enrollment.count()

    // Assuming fixed price 3999 per enrollment for mock revenue
    const totalRevenue = totalEnrollments * 3999

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue
    }
  })

export const getAdminCoursesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await ensureAdmin()

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: {
          select: { enrollments: true, lessons: true }
        }
      }
    })

    const categories = await prisma.category.findMany()

    return { courses, categories }
  })

export const getAdminCourseDetailsFn = createServerFn({ method: 'GET' })
  .validator((d: { courseId: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user || user.role !== 'ADMIN') throw new Error('Unauthorized')
    
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!course) throw new Error('Course not found')
    return course
  })

export const createLessonFn = createServerFn({ method: 'POST' })
  .validator((d: { courseId: string, title: string, description: string, videoUrl: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user || user.role !== 'ADMIN') throw new Error('Unauthorized')

    // Find highest order to append to the end
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = lastLesson ? lastLesson.order + 1 : 1

    const lesson = await prisma.lesson.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        order: nextOrder
      }
    })
    return lesson
  })

export const deleteLessonFn = createServerFn({ method: 'POST' })
  .validator((d: { lessonId: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn()
    if (!user || user.role !== 'ADMIN') throw new Error('Unauthorized')

    await prisma.lesson.delete({
      where: { id: data.lessonId }
    })
    return { success: true }
  })

export const createCourseFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    title: z.string().min(1),
    description: z.string(),
    price: z.number().min(0),
    categoryId: z.string(),
  }))
  .handler(async ({ data }) => {
    await ensureAdmin()

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

    const newCourse = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        published: false,
      }
    })

    return newCourse
  })

export const toggleCoursePublishedFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    courseId: z.string(),
    published: z.boolean(),
  }))
  .handler(async ({ data }) => {
    await ensureAdmin()

    const updatedCourse = await prisma.course.update({
      where: { id: data.courseId },
      data: { published: data.published },
    })

    return updatedCourse
  })
