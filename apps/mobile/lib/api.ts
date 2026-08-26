import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getToken } from "./token";

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // Web platform
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return "http://localhost:3001";
    }
    return envUrl || "http://localhost:3001";
  }

  // If a custom non-localhost URL is explicitly set (e.g. production domain, ngrok tunnel, or explicit IP)
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // Auto-detect development machine host IP from Expo / Metro
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
    (Constants as any)?.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip) {
      return `http://${ip}:3001`;
    }
  }

  // Fallback for Android Emulator (10.0.2.2 maps to host machine localhost)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001";
  }

  // iOS Simulator / default
  return "http://localhost:3001";
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
