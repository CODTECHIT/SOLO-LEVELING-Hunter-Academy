import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MobileNotification {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: MobileNotification[];
  unreadCount: number;
}

export function useNotifications(enabled = true) {
  const qc = useQueryClient();

  const query = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data as NotificationsResponse;
    },
    enabled,
    refetchInterval: 1000 * 30, // 30s polling
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/notifications/read-all");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    ...query,
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
  };
}
