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
    role: "ADMIN" | "SUB_ADMIN" | "STUDENT";
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUB_ADMIN" | "STUDENT";
}
