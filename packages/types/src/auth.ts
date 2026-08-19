export type UserRole = "ADMIN" | "MANAGER" | "TECHNICAL_TEAM" | "STUDENT";

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    customRoleId?: string | null;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  customRoleId?: string | null;
}

