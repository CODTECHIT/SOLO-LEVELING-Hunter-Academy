import { PrismaClient } from '@prisma/client'
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

  // 2. Create Courses
  const course1 = await prisma.course.upsert({
    where: { slug: 'advanced-dungeon-strategy' },
    update: {},
    create: {
      title: 'Advanced Dungeon Strategy',
      slug: 'advanced-dungeon-strategy',
      description: 'Master the art of navigating S-Rank dungeons, analyzing boss attack patterns, and managing party mana effectively.',
      price: 1999,
      categoryId: catIntelligence.id,
      published: true,
      thumbnail: 'https://images.unsplash.com/photo-1614088616147-3cb83fc36109?auto=format&fit=crop&q=80',
    },
  })

  const course2 = await prisma.course.upsert({
    where: { slug: 'shadow-extraction-101' },
    update: {},
    create: {
      title: 'Shadow Extraction 101',
      slug: 'shadow-extraction-101',
      description: 'The definitive guide to raising the dead and commanding a shadow army. Exclusive to the Monarch class.',
      price: 2999,
      categoryId: catCombat.id,
      published: true,
      thumbnail: 'https://images.unsplash.com/photo-1542451313056-b7c8e626645f?auto=format&fit=crop&q=80',
    },
  })

  // 3. Create Lessons
  const lessons = [
    {
      courseId: course1.id,
      title: 'Introduction to Dungeon Ecology',
      videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      order: 1,
      duration: 600,
    },
    {
      courseId: course1.id,
      title: 'Boss Aggro Management',
      videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      order: 2,
      duration: 1200,
    },
    {
      courseId: course2.id,
      title: 'Arise: The Vocal Command',
      videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      order: 1,
      duration: 450,
    }
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
