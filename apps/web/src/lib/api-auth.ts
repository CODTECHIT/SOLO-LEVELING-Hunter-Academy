import { api, setAuthToken } from "./api";
import type { SignUpRequest, SignInRequest, AuthResponse, User } from "@lms/types";
export type { SignUpRequest, SignInRequest, AuthResponse, User };



export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/signup", data);
  setAuthToken(response.data.token);
  return response.data;
}

export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/signin", data);
  setAuthToken(response.data.token);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.post<User>("/auth/me");
  return response.data;
}

export async function logout() {
  // Clear token locally
  const { clearAuth } = await import("./api");
  clearAuth();
}
