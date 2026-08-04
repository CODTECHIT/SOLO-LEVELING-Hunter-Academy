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
    <header className="sticky top-0 z-50 border-b border-neon-purple/25 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left Side: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 flex-1 justify-start">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{
                className: "text-neon-cyan border-neon-cyan/50 bg-neon-cyan/10 shadow-[0_0_12px_rgba(0,243,255,0.2)]",
              }}
              inactiveProps={{ className: "text-muted-foreground border-transparent hover:text-foreground" }}
              className="rounded-lg border px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu trigger on the left for small screens */}
        <div className="lg:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>

        {/* Center: BIG Prominent Logo */}
        <div className="flex-1 flex justify-center items-center">
          <Link to="/" className="flex flex-col sm:flex-row items-center gap-2 group py-1">
            <img
              src="/logo.png"
              alt="Solo Leveling Hunter Academy Logo"
              className="h-14 sm:h-18 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_16px_rgba(0,243,255,0.5)]"
            />
            <div className="text-center sm:text-left">
              <span className="block font-display text-base sm:text-lg font-black tracking-widest text-neon uppercase leading-none">
                Cyber Tech
              </span>
              <span className="block text-[10px] uppercase tracking-[0.35em] text-neon-cyan/80 font-bold mt-0.5">
                Hunter Academy
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex-1 flex items-center justify-end gap-2">
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
            <Button variant="neon" size="sm" className="font-display tracking-wider">
              <Shield className="w-4 h-4" /> Sign in
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {open && (
        <nav className="grid gap-1 border-t border-neon-purple/20 px-4 py-3 lg:hidden bg-background/95 backdrop-blur-2xl">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-neon-cyan font-bold bg-neon-cyan/10" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors"
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
