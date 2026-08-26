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

export async function handleOAuthUrl(rawUrl?: string | null): Promise<AuthResponse> {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let code: string | null = null;

  if (rawUrl) {
    try {
      const formattedUrl = rawUrl.replace("#", "?");
      const parsed = new URL(formattedUrl);
      accessToken = parsed.searchParams.get("access_token");
      refreshToken = parsed.searchParams.get("refresh_token");
      code = parsed.searchParams.get("code");
    } catch (e) {
      console.warn("Failed to parse OAuth URL:", e);
    }
  }

  // If we received PKCE code, exchange it with Supabase
  if (code) {
    try {
      const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
      if (!codeErr && codeData?.session) {
        accessToken = codeData.session.access_token;
        refreshToken = codeData.session.refresh_token;
      }
    } catch (e) {
      console.warn("PKCE code exchange error:", e);
    }
  }

  let email: string | null = null;
  let name: string = "Hunter";

  // If access token was in URL hash/params, set session in Supabase client
  if (accessToken) {
    try {
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
    } catch (e) {
      console.warn("Supabase setSession error:", e);
    }
  }

  // If token or email is still not found, check existing Supabase session
  if (!accessToken || !email) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        accessToken = sessionData.session.access_token;
        email = sessionData.session.user.email ?? null;
        name =
          sessionData.session.user.user_metadata?.full_name ||
          sessionData.session.user.user_metadata?.name ||
          sessionData.session.user.email?.split("@")[0] ||
          "Hunter";
      }
    } catch (e) {
      console.warn("Supabase getSession error:", e);
    }
  }

  // Fallback to getUser() if email is still missing
  if (!email) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
        email = userData.user.email;
        name =
          userData.user.user_metadata?.full_name ||
          userData.user.user_metadata?.name ||
          "Hunter";
      }
    } catch (e) {
      console.warn("Supabase getUser error:", e);
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

  return await handleOAuthUrl(result.url);
}

export async function getCurrentUser() {
  const response = await api.post("/auth/me");
  return response.data;
}
