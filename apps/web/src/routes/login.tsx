import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Lock, Mail, Swords, Loader2 } from "lucide-react";
import { AuthLayout, Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signIn } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";
import { loginUserFn } from "@/server/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Hunter Login — Cyber Tech Academy" },
      { name: "description", content: "Sign in to Cyber Tech Academy." },
    ],
  }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Establish session cookie for SSR/layout loaders
      await loginUserFn({ data: { email, password } });

      // 2. Also obtain API JWT token for client-side API calls
      try {
        await signIn({ email, password });
      } catch (apiErr) {
        console.warn("API sign-in optional warning:", apiErr);
      }

      await router.navigate({ to: "/dashboard" });
    } catch (err: any) {
      let msg =
        err.response?.data?.message || err.message || "Failed to login. Check your credentials.";
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed[0].message;
        }
      } catch {}
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Panel accent="cyan" className="p-7">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Solo Leveling Logo"
            className="mx-auto h-16 w-auto object-contain mb-3 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]"
          />
          <p className="font-display text-2xl font-bold tracking-widest text-neon">Cyber Tech</p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Academy</p>
          <h1 className="mt-6 font-display text-lg font-bold uppercase text-neon-cyan glow-text">
            Enter the gate
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
          <AuthField label="Hunter ID / Email" icon={<Mail className="size-4" />}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jinwoo@hunter.ac"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Password" icon={<Lock className="size-4" />}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="accent-[var(--neon-purple)]" /> Remember device
            </label>
            <Link to="/reset-password" className="text-neon-cyan underline underline-offset-4">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={isLoading} variant="hero" size="xl" className="w-full">
            {isLoading ? <Loader2 className="animate-spin" /> : <Swords />}{" "}
            {isLoading ? "Authenticating..." : "Arise & Login"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="bg-zinc-900 px-2">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="xl"
            className="w-full border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800"
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin + "/auth/callback" },
              })
            }
          >
            Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            No hunter license yet?{" "}
            <Link to="/signup" className="text-neon-lime underline underline-offset-4">
              Awaken now
            </Link>
          </p>
        </form>

        <p className="mt-7 border-t border-border/60 pt-4 text-center text-[10px] text-muted-foreground">
          © Solo Learning Academy
        </p>
      </Panel>
    </AuthLayout>
  );
}

export function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-neon-purple/40 bg-background/50 px-3 pb-1 pt-2 shadow-[0_0_20px_-10px_var(--neon-purple)] transition-colors focus-within:border-neon-cyan/70">
      <span className="font-display text-[10px] uppercase tracking-[0.18em] text-neon-cyan">
        {label}
      </span>
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {children}
      </span>
    </label>
  );
}
