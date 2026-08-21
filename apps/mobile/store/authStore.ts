import { create } from "zustand";
import { api } from "@/lib/api";
import { saveToken, clearToken, signInWithGoogle } from "@/lib/auth";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<User>("/auth/me");
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/signin", {
      email,
      password,
    });
    await saveToken(data.token);
    set({ user: data.user, isAuthenticated: true });
  },

  signup: async (name, email, password, phone) => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/signup", {
      name,
      email,
      password,
      phone,
    });
    await saveToken(data.token);
    set({ user: data.user, isAuthenticated: true });
  },

  loginWithGoogle: async () => {
    const res = await signInWithGoogle();
    set({ user: res.user, isAuthenticated: true });
  },

  logout: async () => {
    await clearToken();
    set({ user: null, isAuthenticated: false });
  },
}));
