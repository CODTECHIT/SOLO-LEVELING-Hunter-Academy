import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let authToken: string | null = null;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
}

export function getAuthToken() {
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("authToken");
  }
  return authToken;
}

export function clearAuth() {
  authToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
}

export async function loadAuthTokenFromStorage() {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
  }
}
