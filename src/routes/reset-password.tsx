import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Mail, Sparkles } from "lucide-react";
import { AuthLayout, Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Recover Your Awakening — Solo Leveling Academy" },
      {
        name: "description",
        content:
          "Reset your Solo Leveling Academy password with an email or mobile reset code and return to your learning portal.",
      },
      { property: "og:title", content: "Recover Your Awakening" },
      {
        property: "og:description",
        content: "Reset your hunter password and re-enter the learning portal.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  return (
    <AuthLayout>
      <Panel className="p-7">
        <div className="text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-neon">SOLO LEVELING</p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Academy</p>
          <h1 className="mt-6 font-display text-lg font-bold uppercase leading-tight text-neon-cyan glow-text">
            Recover your awakening password
          </h1>
          <p className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Reset Password
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <Field label="Email address or mobile number" icon={<Mail className="size-4" />}>
            <input
              type="text"
              placeholder="e.g., jinwoo@hunter.ac"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Enter code from reset link" icon={<KeyRound className="size-4" />}>
            <input
              inputMode="numeric"
              placeholder="e.g., 654 321"
              className="h-11 w-full min-w-0 bg-transparent text-sm tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-muted-foreground"
            />
          </Field>

          <button className="mx-auto block text-xs text-neon-cyan underline underline-offset-4 hover:glow-text">
            I don't have a code, send link again
          </button>

          <p className="text-center text-xs text-muted-foreground">
            We'll send you a password reset link to access your learning portal.
          </p>

          <div className="relative pt-4">
            <span className="absolute top-0 left-1/2 z-10 -translate-x-1/2 font-display text-[10px] uppercase tracking-[0.3em] text-neon-pink">
              Level Up
            </span>
            <Button variant="hero" size="xl" className="w-full">
              <Sparkles /> Reset Password
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-neon-cyan"
            >
              Back to Login
            </Link>
          </div>
        </div>

        <p className="mt-7 border-t border-border/60 pt-4 text-center text-[10px] text-muted-foreground">
          © Solo Learning Academy
        </p>
      </Panel>
    </AuthLayout>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-neon-cyan/40 bg-background/50 px-3 pb-1 pt-2 shadow-[0_0_20px_-10px_var(--neon-cyan)] transition-colors focus-within:border-neon-purple/70">
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
