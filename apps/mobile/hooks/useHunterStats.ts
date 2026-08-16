import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type HunterStats = {
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
};

export function useHunterStats(enabled = true) {
  return useQuery<HunterStats>({
    queryKey: ["hunter-stats"],
    queryFn: async () => {
      const { data } = await api.get("/users/stats");
      return data as HunterStats;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
