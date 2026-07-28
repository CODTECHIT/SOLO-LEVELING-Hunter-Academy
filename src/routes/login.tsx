import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Mail, Swords } from "lucide-react";
import { AuthLayout, Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Hunter Login — Solo Leveling Academy" },
      {
        name: "description",
        content: "Sign in to Solo Leveling Academy and continue leveling up your courses and XP.",
      },
      { property: "og:title", content: "Hunter Login — Solo Leveling Academy" },
      {
        property: "og:description",
        content: "Enter the gate and resume your ranked learning path.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <AuthLayout>
      <Panel accent="cyan" className="p-7">
        <div className="text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-neon">SOLO LEVELING</p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Academy</p>
          <h1 className="mt-6 font-display text-lg font-bold uppercase text-neon-cyan glow-text">
            Enter the gate
          </h1>
        </div>

        <div className="mt-7 space-y-5">
          <AuthField label="Hunter ID / Email" icon={<Mail className="size-4" />}>
            <input
              placeholder="jinwoo@hunter.ac"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Password" icon={<Lock className="size-4" />}>
            <input
              type="password"
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

          <Button variant="hero" size="xl" className="w-full">
            <Swords /> Arise & Login
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            No hunter license yet?{" "}
            <Link to="/signup" className="text-neon-lime underline underline-offset-4">
              Awaken now
            </Link>
          </p>
        </div>

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
