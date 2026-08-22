export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  price: number;
  categoryId: string;
  published: boolean;
  type: "FULL" | "MODULE";
  _count: {
    enrollments: number;
  };
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
  reviews: Review[];
  quizzes?: {
    id: string;
    title: string;
    description?: string | null;
    timeLimit: number;
    passingScore: number;
    _count?: { questions: number };
  }[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  duration?: number | null;
  order: number;
  quiz?: {
    id: string;
    title: string;
    description?: string | null;
    timeLimit: number;
    passingScore: number;
    _count?: { questions: number };
  } | null;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}
