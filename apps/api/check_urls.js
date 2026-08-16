const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    select: { title: true, videoUrl: true }
  });
  console.log("Lessons in DB:", lessons);
}

main().finally(() => prisma.$disconnect());
