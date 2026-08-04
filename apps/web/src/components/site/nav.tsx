import { Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Menu, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/pricing", label: "Hunter Pass" },
] as const;

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neon-purple/25 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/logo.png"
            alt="Solo Leveling Hunter Academy Logo"
            className="h-9 w-auto object-contain transition-transform hover:scale-105"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-bold tracking-widest text-neon">
              Cyber Tech
            </span>
            <span className="block truncate text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Hunter Academy
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{
                className: "text-neon-cyan border-neon-cyan/50 bg-neon-cyan/10",
              }}
              inactiveProps={{ className: "text-muted-foreground border-transparent" }}
              className="rounded-lg border px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Calendar"
          >
            <CalendarDays className="text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Alerts">
            <Bell className="text-muted-foreground" />
          </Button>
          <Link to="/login">
            <Button variant="neon" size="sm">
              <Shield /> Sign in
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-neon-purple/20 px-4 py-3 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-neon-cyan" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-neon-purple/20 py-8 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Cyber Tech Academy — Arise, Hunter.
    </footer>
  );
}

export function PageShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.12em] text-neon sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
