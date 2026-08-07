import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type HeroTarget = "/signup" | "/pricing" | "/courses" | "/dashboard" | "/admin/academy";

type Cta = { label: string; to: HeroTarget };

export function HeroCtas({
  user,
  loggedOut,
  student,
  admin,
}: {
  user?: { role?: string } | null;
  loggedOut: { primary: Cta; secondary: Cta };
  student: { primary: Cta; secondary: Cta };
  admin: { primary: Cta; secondary: Cta };
}) {
  const config = !user ? loggedOut : user.role === "ADMIN" ? admin : student;

  return (
    <>
      <Button asChild size="xl" variant="hero" className="w-full sm:w-auto">
        <Link to={config.primary.to}>{config.primary.label}</Link>
      </Button>
      <Button asChild size="xl" variant="neon" className="w-full sm:w-auto">
        <Link to={config.secondary.to}>{config.secondary.label}</Link>
      </Button>
    </>
  );
}
