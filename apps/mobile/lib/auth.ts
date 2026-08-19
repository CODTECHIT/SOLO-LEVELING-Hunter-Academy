import { saveToken, getToken, clearToken } from "./token";
export { saveToken, getToken, clearToken };
import { api } from "./api";

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
  };
  token: string;
}

export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>("/auth/signup", data);
    await saveToken(response.data.token);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>("/auth/signin", data);
    await saveToken(response.data.token);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.post("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
}
