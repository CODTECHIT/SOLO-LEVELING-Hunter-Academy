import { api } from "./api";

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeUsersLast30Days: number;
}

export interface RefundRequest {
  id: string;
  userId: string;
  paymentId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getAdminDashboard(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/admin/dashboard");
  return response.data;
}

export async function listRefundRequests(): Promise<RefundRequest[]> {
  const response = await api.get<RefundRequest[]>("/admin/refunds");
  return response.data;
}
