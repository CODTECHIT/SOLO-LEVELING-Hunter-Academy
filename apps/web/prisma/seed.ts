import { PrismaClient, CourseType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config"

// We must explicitly use the adapter even in the seed script
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 1. Create Categories
  const catCombat = await prisma.category.upsert({
    where: { slug: 'combat' },
    update: {},
    create: { name: 'Combat Mastery', slug: 'combat' },
  })

  const catIntelligence = await prisma.category.upsert({
    where: { slug: 'intelligence' },
    update: {},
    create: { name: 'Intelligence & Strategy', slug: 'intelligence' },
  })

  // 2. Create / update Courses (upsert keeps re-runs idempotent and lets us
  //    re-align the demo prices and course types after schema changes)
  const fullCourses = [
    {
      slug: 'advanced-dungeon-strategy',
      title: 'Advanced Dungeon Strategy',
      description: 'Master the art of navigating S-Rank dungeons, analyzing boss attack patterns, and managing party mana effectively.',
      price: 3999,
      categoryId: catIntelligence.id,
      thumbnail: 'https://images.unsplash.com/photo-1614088616147-3cb83fc36109?auto=format&fit=crop&q=80',
    },
    {
      slug: 'shadow-extraction-101',
      title: 'Shadow Extraction 101',
      description: 'The definitive guide to raising the dead and commanding a shadow army. Exclusive to the Monarch class.',
      price: 3999,
      categoryId: catCombat.id,
      thumbnail: 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?auto=format&fit=crop&q=80',
    },
  ]

  const moduleCourses = [
    {
      slug: 'phishing-social-engineering-basics',
      title: 'Phishing & Social Engineering Basics',
      description: 'A quick module on spotting phishing emails, vishing calls, and the social tricks attackers use to break in.',
      price: 399,
      categoryId: catIntelligence.id,
      thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80',
    },
    {
      slug: 'sql-injection-fundamentals',
      title: 'SQL Injection Fundamentals',
      description: 'Understand how SQL injection works, how to test for it safely, and the fixes that close the hole for good.',
      price: 399,
      categoryId: catIntelligence.id,
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80',
    },
    {
      slug: 'ransomware-defense-playbook',
      title: 'Ransomware Defense Playbook',
      description: 'A short, practical playbook for defending endpoints against ransomware: backups, EDR, and response steps.',
      price: 399,
      categoryId: catCombat.id,
      thumbnail: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80',
    },
    {
      slug: 'incident-response-essentials',
      title: 'Incident Response Essentials',
      description: 'The first-response module: containment, evidence handling, and communication when an incident is confirmed.',
      price: 399,
      categoryId: catCombat.id,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80',
    },
  ]

  const courseSpecs = [
    ...fullCourses.map((c) => ({ ...c, type: CourseType.FULL })),
    ...moduleCourses.map((c) => ({ ...c, type: CourseType.MODULE })),
  ]

  const managedSlugs = courseSpecs.map((c) => c.slug)

  const created: Record<string, { id: string }> = {}
  for (const spec of courseSpecs) {
    const course = await prisma.course.upsert({
      where: { slug: spec.slug },
      update: {
        title: spec.title,
        description: spec.description,
        price: spec.price,
        type: spec.type,
        categoryId: spec.categoryId,
        thumbnail: spec.thumbnail,
        published: true,
      },
      create: {
        title: spec.title,
        slug: spec.slug,
        description: spec.description,
        price: spec.price,
        type: spec.type,
        categoryId: spec.categoryId,
        thumbnail: spec.thumbnail,
        published: true,
      },
    })
    created[spec.slug] = course
  }

  // 3. Lessons — rebuild deterministically for the courses we manage so re-seeding
  //    never stacks duplicates. NOTE: re-running the seed re-publishes the managed
  //    courses (upsert update above) and wipes any lessons/progress an admin or
  //    student added to them — dev-only data, never run against production.
  await prisma.lessonProgress.deleteMany({
    where: { lesson: { course: { slug: { in: managedSlugs } } } },
  })
  await prisma.lesson.deleteMany({
    where: { course: { slug: { in: managedSlugs } } },
  })

  const lessons = [
    // Full course 1
    { courseId: created['advanced-dungeon-strategy'].id, title: 'Introduction to Dungeon Ecology', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', order: 1, duration: 600 },
    { courseId: created['advanced-dungeon-strategy'].id, title: 'Boss Aggro Management', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', order: 2, duration: 1200 },
    // Full course 2
    { courseId: created['shadow-extraction-101'].id, title: 'Arise: The Vocal Command', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', order: 1, duration: 450 },
    { courseId: created['shadow-extraction-101'].id, title: 'Raising Your First Shadow', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', order: 2, duration: 720 },
    // Modules
    { courseId: created['phishing-social-engineering-basics'].id, title: 'Anatomy of a Phishing Email', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', order: 1, duration: 540 },
    { courseId: created['sql-injection-fundamentals'].id, title: 'Injecting Your First Query', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', order: 1, duration: 600 },
    { courseId: created['ransomware-defense-playbook'].id, title: 'Locking Down the Endpoint', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', order: 1, duration: 480 },
    { courseId: created['incident-response-essentials'].id, title: 'Contain Before You Cure', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', order: 1, duration: 660 },
  ]

  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: lesson,
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
