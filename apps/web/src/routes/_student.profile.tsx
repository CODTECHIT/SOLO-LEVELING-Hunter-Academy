import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getCurrentUserFn, updateProfileFn, logoutFn } from "@/server/auth";
import { clearAuth } from "@/lib/api";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { UserCircle, Shield, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_student/profile")({
  loader: async () => {
    const user = await getCurrentUserFn();
    return { user };
  },
  head: () => ({
    meta: [{ title: "Hunter Profile — Cyber Tech Academy" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    try {
      setIsSubmitting(true);
      await updateProfileFn({ data: { name, phone } });
      setSuccessMsg("Profile updated successfully.");
      router.invalidate();
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    try {
      setIsLoggingOut(true);
      await logoutFn();
      clearAuth();
      router.navigate({ to: "/" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <UserCircle className="w-8 h-8 text-neon-purple" />
        <h1 className="font-display text-2xl font-bold text-foreground">Hunter Profile</h1>
      </div>

      <Panel accent="purple">
        <PanelTitle right={<Shield className="w-4 h-4 text-neon-purple" />}>System Credentials</PanelTitle>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 p-3 text-sm text-neon-cyan">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6 mt-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Hunter Name</label>
              <input
                name="name"
                defaultValue={user.name || ""}
                required
                className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Phone Number</label>
              <input
                name="phone"
                defaultValue={user.phone || ""}
                className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                placeholder="+91..."
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Email Address (Read-only)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed opacity-70"
            />
            <p className="mt-1 text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>

          <div className="pt-4 border-t border-border/50 flex flex-wrap gap-4 items-center justify-between">
            <Button
              type="submit"
              variant="neonPurple"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
