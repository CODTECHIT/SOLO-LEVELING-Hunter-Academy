import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { KeyRound, Mail, Sparkles, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout, Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Recover Your Awakening — Cyber Tech Academy" },
      {
        name: "description",
        content:
          "Reset your Cyber Tech Academy password with an email verification code and return to your learning portal.",
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
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      toast.success(res.data?.message || "Verification code sent to your email!");
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to send reset code";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      toast.success(res.data?.message || "Password reset successful!");
      setSuccessMsg("Password successfully reset! Redirecting to login...");
      setTimeout(() => {
        router.navigate({ to: "/login" });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Password reset failed";
      setError(msg);
      toast.error(msg);
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
          <h1 className="mt-6 font-display text-lg font-bold uppercase leading-tight text-neon-cyan glow-text">
            {step === 1 ? "Recover Your Account" : "Set New Password"}
          </h1>
          <p className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {step === 1 ? "Step 1 of 2: Request Code" : "Step 2 of 2: Verify & Reset"}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-neon-lime/40 bg-neon-lime/10 p-3 text-center text-xs font-semibold text-neon-lime">
            <CheckCircle2 className="size-4" />
            {successMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="mt-7 space-y-5">
            <Field label="Hunter ID / Email Address" icon={<Mail className="size-4" />}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., hunter@gmail.com"
                className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>

            <p className="text-center text-xs text-muted-foreground">
              We will transmit a 6-digit awakening code to your email to verify account ownership.
            </p>

            <Button
              type="submit"
              disabled={isLoading}
              variant="hero"
              size="xl"
              className="w-full cursor-pointer"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isLoading ? "Transmitting..." : "Send Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-7 space-y-4">
            <div className="rounded-lg bg-surface2/50 p-2 text-center text-xs text-neon-cyan">
              Code sent to: <span className="font-semibold text-foreground">{email}</span>
            </div>

            <Field label="6-Digit Reset Code" icon={<KeyRound className="size-4" />}>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="654321"
                className="h-11 w-full min-w-0 bg-transparent text-sm font-bold tracking-[0.3em] outline-none placeholder:tracking-normal placeholder:text-muted-foreground"
              />
            </Field>

            <Field label="New Password" icon={<Lock className="size-4" />}>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>

            <Field label="Confirm New Password" icon={<Lock className="size-4" />}>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>

            <Button
              type="submit"
              disabled={isLoading || !!successMsg}
              variant="hero"
              size="xl"
              className="w-full cursor-pointer mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isLoading ? "Updating..." : "Arise & Reset Password"}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mx-auto block text-xs text-neon-cyan underline underline-offset-4 hover:glow-text mt-3"
            >
              Didn't receive code? Resend
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-neon-cyan"
          >
            <ArrowLeft className="size-3" /> Back to Login
          </Link>
        </div>

        <p className="mt-7 border-t border-border/60 pt-4 text-center text-[10px] text-muted-foreground">
          © CyberTech Academy
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
