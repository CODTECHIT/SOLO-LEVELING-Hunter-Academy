import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useServerFn } from "@tanstack/react-start";
import { syncSupabaseOAuthUserFn } from "@/server/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
  const syncUser = useServerFn(syncSupabaseOAuthUserFn);
  const [status, setStatus] = useState("Verifying Google credentials...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let handled = false;

    const processSession = async (session: any) => {
      if (!session?.user || handled) return;
      handled = true;
      setStatus("Synchronizing your hunter profile...");

      const email = session.user.email;
      const name =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "Hunter";

      if (!email) {
        setErrorMsg("No email address provided by Google account.");
        return;
      }

      if (!session.access_token) {
        setErrorMsg("No valid OAuth token returned by provider.");
        return;
      }

      try {
        const res = await syncUser({
          data: {
            email,
            name,
            accessToken: session.access_token,
          },
        });

        if (res.token) {
          const { setAuthToken } = await import("@/lib/api");
          setAuthToken(res.token);
        }

        const target =
          res.role === "ADMIN" ||
          res.role === "MANAGER" ||
          res.role === "TECHNICAL_TEAM"
            ? "/admin/academy"
            : "/dashboard";

        window.location.href = target;
      } catch (err: any) {
        console.error("OAuth sync error:", err);
        setErrorMsg(err.message || "Failed to synchronize profile. Please try logging in again.");
      }
    };

    // 1. Check for PKCE 'code' in query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (data?.session) {
          processSession(data.session);
        } else if (error) {
          console.warn("PKCE exchange note:", error.message);
        }
      });
    }

    // 2. Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processSession(session);
      }
    });

    // 3. Listen to onAuthStateChange for token events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        processSession(session);
      }
    });

    // Timeout fallback if no token exchanged after 8 seconds
    const timeout = setTimeout(() => {
      if (!handled) {
        setErrorMsg("Authentication timed out. Please verify your Supabase Redirect URL settings.");
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [syncUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="p-8 border border-zinc-800 rounded-2xl bg-zinc-900/60 max-w-md w-full flex flex-col items-center text-center shadow-2xl backdrop-blur-md">
        {errorMsg ? (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <h2 className="font-bold text-lg text-foreground">Authentication Error</h2>
            <p className="text-sm text-red-400">{errorMsg}</p>
            <Link
              to="/login"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-neon-cyan text-black font-bold text-sm hover:bg-neon-cyan/90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-neon-cyan border-t-transparent mx-auto" />
            <h2 className="font-bold text-base text-foreground">Entering the Gate</h2>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
