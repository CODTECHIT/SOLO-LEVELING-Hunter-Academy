import { saveToken, getToken, clearToken } from "./token";
export { saveToken, getToken, clearToken };
import { api } from "./api";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

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
  const response = await api.post<AuthResponse>("/auth/signup", data);
  await saveToken(response.data.token);
  return response.data;
}

export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/signin", data);
  await saveToken(response.data.token);
  return response.data;
}

export async function signInWithGoogle(): Promise<AuthResponse> {
  const redirectTo = makeRedirectUri({
    scheme: "cybertechacademy",
    path: "auth/callback",
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    throw new Error(error?.message || "Failed to initialize Google Sign-In");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !result.url) {
    throw new Error("Google Sign-In was cancelled");
  }

  const urlObj = new URL(result.url.replace("#", "?"));
  const accessToken = urlObj.searchParams.get("access_token");
  const refreshToken = urlObj.searchParams.get("refresh_token");

  let email: string | null = null;
  let name: string = "Hunter";

  if (accessToken) {
    const { data: sessionData } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    if (sessionData?.user) {
      email = sessionData.user.email ?? null;
      name =
        sessionData.user.user_metadata?.full_name ||
        sessionData.user.user_metadata?.name ||
        sessionData.user.email?.split("@")[0] ||
        "Hunter";
    }
  }

  if (!email) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email) {
      email = userData.user.email;
      name =
        userData.user.user_metadata?.full_name ||
        userData.user.user_metadata?.name ||
        "Hunter";
    }
  }

  if (!accessToken) {
    throw new Error("No valid access token received from Google sign in");
  }

  const response = await api.post<AuthResponse>("/auth/oauth/sync", {
    email,
    name,
    accessToken,
  });

  await saveToken(response.data.token);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.post("/auth/me");
  return response.data;
}
