import { api } from "./api";

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

export async function enrollInCourse(
  courseId: string,
): Promise<{ message: string; enrollment: Enrollment }> {
  const response = await api.post(`/enrollments/${courseId}`);
  return response.data;
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const response = await api.get<Enrollment[]>("/enrollments");
  return response.data;
}

export async function checkEnrollment(courseId: string): Promise<{ isEnrolled: boolean }> {
  const response = await api.get<{ isEnrolled: boolean }>(`/enrollments/${courseId}/enrolled`);
  return response.data;
}
