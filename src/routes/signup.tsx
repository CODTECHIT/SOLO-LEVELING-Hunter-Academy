import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Mail, Smartphone, UserPlus } from "lucide-react";
import { AuthLayout, Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { AuthField } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Awaken — Sign Up for Solo Leveling Academy" },
      {
        name: "description",
        content:
          "Create your hunter account, pick a rank path and start earning XP across gamified courses.",
      },
      { property: "og:title", content: "Awaken — Sign Up for Solo Leveling Academy" },
      {
        property: "og:description",
        content: "Register as a hunter and begin your ranked learning journey.",
      },
    ],
  }),
  component: Signup,
});

function Signup() {
  return (
    <AuthLayout>
      <Panel className="p-7">
        <div className="text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-neon">SOLO LEVELING</p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Academy</p>
          <h1 className="mt-6 font-display text-lg font-bold uppercase text-neon-cyan glow-text">
            Awakening registration
          </h1>
        </div>

        <div className="mt-7 space-y-5">
          <AuthField label="Hunter Name" icon={<UserPlus className="size-4" />}>
            <input
              placeholder="Sung Jin-Woo"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Email address" icon={<Mail className="size-4" />}>
            <input
              placeholder="jinwoo@hunter.ac"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Mobile number" icon={<Smartphone className="size-4" />}>
            <input
              placeholder="+91 98765 43210"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>
          <AuthField label="Create password" icon={<Lock className="size-4" />}>
            <input
              type="password"
              placeholder="••••••••"
              className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </AuthField>

          <Button variant="hero" size="xl" className="w-full">
            Begin Awakening
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already licensed?{" "}
            <Link to="/login" className="text-neon-cyan underline underline-offset-4">
              Back to Login
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
