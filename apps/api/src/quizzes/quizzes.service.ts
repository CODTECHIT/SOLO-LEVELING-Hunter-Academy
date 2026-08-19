import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async findAll(courseId?: string) {
    return this.prisma.quiz.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOneForStudent(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
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

    if (!quiz) throw new NotFoundException("Quiz not found");
    return quiz;
  }

  async submitAttempt(
    userId: string,
    quizId: string,
    answers: { questionId: string; selectedOptionId?: string | null }[]
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) throw new NotFoundException("Quiz not found");

    let totalMarks = 0;
    let earnedScore = 0;
    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
    const answerResults: {
      questionId: string;
      question: string;
      selectedOptionId: string | null;
      correctOptionId: string | null;
      isCorrect: boolean;
      explanation: string | null;
      marks: number;
    }[] = [];

    for (const q of quiz.questions) {

      const qMarks = q.marks || 1;
      totalMarks += qMarks;

      const selectedOptId = answerMap.get(q.id) || null;
      const correctOpt = q.options.find((o) => o.isCorrect);
      const isCorrect = Boolean(selectedOptId && correctOpt && selectedOptId === correctOpt.id);

      if (isCorrect) earnedScore += qMarks;

      answerResults.push({
        questionId: q.id,
        question: q.question,
        selectedOptionId: selectedOptId,
        correctOptionId: correctOpt?.id || null,
        isCorrect,
        explanation: q.explanation,
        marks: qMarks,
      });
    }

    const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const submission = await this.prisma.quizSubmission.create({
      data: {
        quizId: quiz.id,
        userId,
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
  }

  async getStudentSubmissions(userId: string, quizId: string) {
    return this.prisma.quizSubmission.findMany({
      where: { userId, quizId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }
}
