import { create } from "zustand";

type UIState = {
  toastMessage: string | null;
  toastType: "success" | "error" | "info";
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null,
  toastType: "info",
  showToast: (msg, type = "info") => {
    set({ toastMessage: msg, toastType: type });
    setTimeout(() => set({ toastMessage: null }), 3500);
  },
  clearToast: () => set({ toastMessage: null }),
}));
