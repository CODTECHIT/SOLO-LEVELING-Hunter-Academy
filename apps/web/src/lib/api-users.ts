import { api } from "./api";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "ADMIN" | "SUB_ADMIN" | "STUDENT";
  createdAt: string;
}

export interface EnrolledCourse {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  expiresAt?: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    price: number;
    _count: {
      lessons: number;
    };
  };
}

export interface LearningProgress {
  enrolledCourses: number;
  lessonsCompleted: number;
}

export interface HunterStats {
  rankLetter: string;
  rankName: string;
  expTotal: number;
  expCurrent: number;
  expMax: number;
  focusPct: number;
  mpPercent: number;
  streak: number;
  coursesTaken: number;
  coursesCompleted: number;
  lessonsCompleted: number;
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/users/profile");
  return response.data;
}

export async function getUserEnrollments(): Promise<EnrolledCourse[]> {
  const response = await api.get<EnrolledCourse[]>("/users/enrollments");
  return response.data;
}

export async function getUserProgress(): Promise<LearningProgress> {
  const response = await api.get<LearningProgress>("/users/progress");
  return response.data;
}

export async function getHunterStats(): Promise<HunterStats> {
  const response = await api.get<HunterStats>("/users/stats");
  return response.data;
}
