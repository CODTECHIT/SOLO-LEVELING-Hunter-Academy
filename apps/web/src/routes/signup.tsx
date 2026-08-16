import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Lock, Mail, Smartphone, UserPlus, Loader2 } from "lucide-react";
import { AuthLayout, Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { AuthField } from "./login";
import { useState } from "react";
import { signUp } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Awaken — Sign Up for Cyber Tech Academy" }],
  }),
  component: Signup,
});

function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signUp({ name, email, password, phone });
      await router.navigate({ to: "/dashboard" });
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to register. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Panel className="p-7">
        <div className="text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-neon">Cyber Tech</p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Academy</p>
          <h1 className="mt-6 font-display text-lg font-bold uppercase text-neon-cyan glow-text">
            Awakening registration
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
          <AuthField label="Hunter Name" icon={<UserPlus className="size-4" />}>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cyber Tech"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Email address" icon={<Mail className="size-4" />}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jinwoo@hunter.ac"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Mobile number" icon={<Smartphone className="size-4" />}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Create password" icon={<Lock className="size-4" />}>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>

          <Button type="submit" disabled={isLoading} variant="hero" size="xl" className="w-full">
            {isLoading ? <Loader2 className="animate-spin" /> : "Begin Awakening"}
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
            Already licensed?{" "}
            <Link to="/login" className="text-neon-cyan underline underline-offset-4">
              Back to Login
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
