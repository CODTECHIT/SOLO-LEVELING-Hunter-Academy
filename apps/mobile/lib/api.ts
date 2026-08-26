import axios from "axios";
import { Platform } from "react-native";
import { getToken } from "./token";

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3001";
    }
  }
  return (
    envUrl ||
    (Platform.OS === "android"
      ? "http://10.0.2.2:3001"
      : "http://localhost:3001")
  );
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — authStore will catch this and redirect to login
      // ponytail: no router import here to avoid circular deps; let callers handle 401
    }
    return Promise.reject(error);
  },
);
