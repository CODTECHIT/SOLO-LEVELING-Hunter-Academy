export interface QuizOptionDTO {
  id?: string;
  text: string;
  isCorrect: boolean;
  order?: number;
}

export interface QuizQuestionDTO {
  id?: string;
  question: string;
  explanation?: string | null;
  order?: number;
  marks?: number;
  options: QuizOptionDTO[];
}

export interface QuizDTO {
  id?: string;
  title: string;
  description?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  timeLimit: number; // minutes, 0 = unlimited
  passingScore: number; // percentage (e.g. 50)
  questions?: QuizQuestionDTO[];
  createdAt?: string;
}

export interface QuizSubmissionAnswerDTO {
  questionId: string;
  selectedOptionId?: string | null;
}

export interface SubmitQuizRequest {
  quizId: string;
  answers: QuizSubmissionAnswerDTO[];
}

export interface QuizSubmissionResultDTO {
  submissionId: string;
  quizId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  answers: {
    questionId: string;
    question: string;
    selectedOptionId?: string | null;
    correctOptionId?: string | null;
    isCorrect: boolean;
    explanation?: string | null;
  }[];
}

export interface BulkImportQuestionRow {
  question: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctOption: "A" | "B" | "C" | "D" | string;
  explanation?: string;
  marks?: number;
}
