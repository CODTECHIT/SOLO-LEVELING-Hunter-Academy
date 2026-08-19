import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { getCurrentUserFn } from "./auth";
import { ensurePermission } from "./permissions";
import { BulkImportQuestionRow } from "@lms/types";

// Get all quizzes for admin management
export const getAdminQuizzesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensurePermission("quizzes");

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: { id: true, title: true, slug: true },
      },
      lesson: {
        select: { id: true, title: true, order: true },
      },
      _count: {
        select: { questions: true, submissions: true },
      },
    },
  });

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      lessons: {
        select: { id: true, title: true, order: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  return { quizzes, courses };
});

// Get single quiz with questions & options for admin editor
export const getAdminQuizDetailsFn = createServerFn({ method: "GET" })
  .validator((d: { quizId: string }) => d)
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: {
        course: { select: { id: true, title: true } },
        lesson: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  });

// Create new quiz
export const createQuizFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      title: string;
      description?: string;
      courseId?: string;
      lessonId?: string;
      timeLimit?: number;
      passingScore?: number;
    }) => d
  )
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        courseId: data.courseId && data.courseId !== "NONE" ? data.courseId : null,
        lessonId: data.lessonId && data.lessonId !== "NONE" ? data.lessonId : null,
        timeLimit: Number(data.timeLimit) || 0,
        passingScore: Number(data.passingScore) || 50,
      },
    });

    return quiz;
  });

// Update quiz metadata
export const updateQuizFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      quizId: string;
      title: string;
      description?: string;
      courseId?: string;
      lessonId?: string;
      timeLimit?: number;
      passingScore?: number;
    }) => d
  )
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    const quiz = await prisma.quiz.update({
      where: { id: data.quizId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        courseId: data.courseId && data.courseId !== "NONE" ? data.courseId : null,
        lessonId: data.lessonId && data.lessonId !== "NONE" ? data.lessonId : null,
        timeLimit: Number(data.timeLimit) || 0,
        passingScore: Number(data.passingScore) || 50,
      },
    });

    return quiz;
  });

// Delete quiz
export const deleteQuizFn = createServerFn({ method: "POST" })
  .validator((d: { quizId: string }) => d)
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    await prisma.quiz.delete({
      where: { id: data.quizId },
    });

    return { success: true };
  });

// Add a single question to a quiz
export const addQuizQuestionFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      quizId: string;
      question: string;
      explanation?: string;
      marks?: number;
      options: { text: string; isCorrect: boolean }[];
    }) => d
  )
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { quizId: data.quizId },
      orderBy: { order: "desc" },
    });
    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    const created = await prisma.quizQuestion.create({
      data: {
        quizId: data.quizId,
        question: data.question.trim(),
        explanation: data.explanation?.trim() || null,
        marks: Number(data.marks) || 1,
        order: nextOrder,
        options: {
          create: data.options.map((opt, idx) => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            order: idx + 1,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return created;
  });

// Update an existing question
export const updateQuizQuestionFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      questionId: string;
      question: string;
      explanation?: string;
      marks?: number;
      options: { id?: string; text: string; isCorrect: boolean }[];
    }) => d
  )
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    // Update question
    await prisma.quizQuestion.update({
      where: { id: data.questionId },
      data: {
        question: data.question.trim(),
        explanation: data.explanation?.trim() || null,
        marks: Number(data.marks) || 1,
      },
    });

    // Delete existing options and recreate to ensure clean ordering & correct flags
    await prisma.quizOption.deleteMany({
      where: { questionId: data.questionId },
    });

    await prisma.quizOption.createMany({
      data: data.options.map((opt, idx) => ({
        questionId: data.questionId,
        text: opt.text.trim(),
        isCorrect: opt.isCorrect,
        order: idx + 1,
      })),
    });

    return { success: true };
  });

// Delete question
export const deleteQuizQuestionFn = createServerFn({ method: "POST" })
  .validator((d: { questionId: string }) => d)
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    await prisma.quizQuestion.delete({
      where: { id: data.questionId },
    });

    return { success: true };
  });

// Bulk Import Questions via JSON / parsed CSV rows
export const bulkImportQuizQuestionsFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      quizId: string;
      rows: BulkImportQuestionRow[];
    }) => d
  )
  .handler(async ({ data }) => {
    await ensurePermission("quizzes");

    if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
      throw new Error("No question rows provided for import");
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      select: { id: true },
    });

    if (!quiz) throw new Error("Target quiz not found");

    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { quizId: data.quizId },
      orderBy: { order: "desc" },
    });
    let currentOrder = lastQuestion ? lastQuestion.order : 0;

    let importedCount = 0;

    for (const row of data.rows) {
      if (!row.question || !row.question.trim()) continue;
      if (!row.optionA || !row.optionB) continue;

      currentOrder += 1;
      const normalizedCorrect = String(row.correctOption || "A").trim().toUpperCase();

      const optionsToCreate = [
        { text: row.optionA.trim(), isCorrect: normalizedCorrect === "A" || normalizedCorrect === "1", order: 1 },
        { text: row.optionB.trim(), isCorrect: normalizedCorrect === "B" || normalizedCorrect === "2", order: 2 },
      ];

      if (row.optionC && row.optionC.trim()) {
        optionsToCreate.push({
          text: row.optionC.trim(),
          isCorrect: normalizedCorrect === "C" || normalizedCorrect === "3",
          order: 3,
        });
      }

      if (row.optionD && row.optionD.trim()) {
        optionsToCreate.push({
          text: row.optionD.trim(),
          isCorrect: normalizedCorrect === "D" || normalizedCorrect === "4",
          order: 4,
        });
      }

      // If none marked correct by mistake, default option A as correct
      if (!optionsToCreate.some((o) => o.isCorrect)) {
        optionsToCreate[0].isCorrect = true;
      }

      await prisma.quizQuestion.create({
        data: {
          quizId: data.quizId,
          question: row.question.trim(),
          explanation: row.explanation?.trim() || null,
          marks: Number(row.marks) || 1,
          order: currentOrder,
          options: {
            create: optionsToCreate,
          },
        },
      });

      importedCount++;
    }

    return { success: true, count: importedCount };
  });

// ---------------- STUDENT QUIZ CONSUMPTION ----------------

// Get Quiz for student attempt (without exposing isCorrect answer flags!)
export const getStudentQuizFn = createServerFn({ method: "GET" })
  .validator((d: { quizId: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Please log in to attempt this quiz");

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        lesson: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            question: true,
            order: true,
            marks: true,
            options: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                text: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) throw new Error("Quiz not found");

    // Fetch previous submissions by student
    const previousSubmissions = await prisma.quizSubmission.findMany({
      where: { quizId: data.quizId, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return { quiz, previousSubmissions };
  });

// Submit Quiz Attempt and compute result
export const submitQuizAttemptFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      quizId: string;
      answers: { questionId: string; selectedOptionId?: string | null }[];
    }) => d
  )
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Please log in to submit this quiz");

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) throw new Error("Quiz not found");

    let totalMarks = 0;
    let earnedScore = 0;
    const answerResults: {
      questionId: string;
      question: string;
      selectedOptionId: string | null;
      correctOptionId: string | null;
      isCorrect: boolean;
      explanation: string | null;
      marks: number;
    }[] = [];

    const answerMap = new Map(data.answers.map((a) => [a.questionId, a.selectedOptionId]));

    for (const q of quiz.questions) {
      const qMarks = q.marks || 1;
      totalMarks += qMarks;

      const selectedOptId = answerMap.get(q.id) || null;
      const correctOpt = q.options.find((o) => o.isCorrect);
      const isCorrect = Boolean(selectedOptId && correctOpt && selectedOptId === correctOpt.id);

      if (isCorrect) {
        earnedScore += qMarks;
      }

      answerResults.push({
        questionId: q.id,
        question: q.question,
        selectedOptionId: selectedOptId,
        correctOptionId: correctOpt ? correctOpt.id : null,
        isCorrect,
        explanation: q.explanation,
        marks: qMarks,
      });
    }

    const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    // Save submission record
    const submission = await prisma.quizSubmission.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        score: earnedScore,
        totalMarks,
        percentage,
        passed,
        answers: {
          create: answerResults.map((a) => ({
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            isCorrect: a.isCorrect,
          })),
        },
      },
    });

    return {
      submissionId: submission.id,
      quizId: quiz.id,
      score: earnedScore,
      totalMarks,
      percentage,
      passed,
      passingScore: quiz.passingScore,
      answers: answerResults,
    };
  });
