import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  type: "FULL" | "MODULE";
  published: boolean;
  category: { id: string; name: string; slug: string };
  lessons: { id: string }[];
};

export type CourseDetailResponse = {
  course: Course & {
    quizzes?: {
      id: string;
      title: string;
      description: string | null;
      timeLimit: number;
      passingScore: number;
      _count?: { questions: number };
    }[];
    lessons: {
      id: string;
      title: string;
      description: string | null;
      videoUrl: string;
      order: number;
      duration: number | null;
      quiz?: {
        id: string;
        title: string;
        description: string | null;
        timeLimit: number;
        passingScore: number;
        _count?: { questions: number };
      } | null;
    }[];
  };
  isEnrolled: boolean;
  hasAccessExpired: boolean;
  completedLessonIds: string[];
  lessonProgress: Record<string, number>;
};

export type CatalogData = {
  courses: Course[];
  fullCourses: Course[];
  moduleCourses: Course[];
  categories: { id: string; name: string; slug: string }[];
};

export function useCatalog(params?: { q?: string; category?: string }) {
  return useQuery<CatalogData>({
    queryKey: ["catalog", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set("q", params.q);
      if (params?.category) searchParams.set("category", params.category);
      const { data } = await api.get(`/courses/catalog?${searchParams}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useCourse(slugOrId: string) {
  return useQuery<CourseDetailResponse>({
    queryKey: ["course", slugOrId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/slug/${encodeURIComponent(slugOrId)}`);
      return data;
    },
    enabled: !!slugOrId,
  });
}

export function useEnrolledCourses() {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: async () => {
      const { data } = await api.get("/enrollments/");
      return data.enrollments as (Course & {
        totalLessons: number;
        completedLessons: number;
        progress: number;
        expiresAt: string | null;
        expired: boolean;
      })[];
    },
  });
}

export function useIntroVideo() {
  return useQuery({
    queryKey: ["intro-video"],
    queryFn: async () => {
      const { data } = await api.get("/courses/intro");
      return data as { id: string; title: string; videoUrl: string; thumbnail: string | null; active: boolean };
    },
  });
}
