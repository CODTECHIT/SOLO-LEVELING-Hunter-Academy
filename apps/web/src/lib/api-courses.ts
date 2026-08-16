import { api } from "./api";
export type { Course, CourseDetail, Lesson, Review, Category } from "@lms/types";


export async function getAllCourses(skip = 0, take = 10): Promise<Course[]> {
  const response = await api.get<Course[]>("/courses", {
    params: { skip, take },
  });
  return response.data;
}

export async function getCourseById(id: string): Promise<CourseDetail> {
  const response = await api.get<CourseDetail>(`/courses/${id}`);
  return response.data;
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail> {
  const response = await api.get<CourseDetail>(`/courses/slug/${slug}`);
  return response.data;
}

export async function searchCourses(query: string, skip = 0, take = 10): Promise<Course[]> {
  const response = await api.get<Course[]>("/courses/search", {
    params: { q: query, skip, take },
  });
  return response.data;
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/courses/categories");
  return response.data;
}
