import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Menu,
  Shield,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format, getDaysInMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { getCurrentUserFn } from "@/server/auth";
import { getStudentNotificationsFn } from "@/server/courses";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/pricing", label: "Hunter Pass" },
] as const;

export function TopNav() {
  const [open, setOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const calRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUserFn>> | null | undefined>(
    undefined,
  );
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; createdAt: Date }[]
  >([]);

  const today = new Date();
  const totalDays = getDaysInMonth(today);
  const startWeekday = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const cells = [
    ...Array<number>(startWeekday).fill(0),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  useEffect(() => {
    getCurrentUserFn()
      .then(setUser)
      .catch(() => setUser(null));
    getStudentNotificationsFn()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCalOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-neon-purple/25 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left Side: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 flex-1 justify-start">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{
                className:
                  "text-neon-cyan border-neon-cyan/50 bg-neon-cyan/10 shadow-[0_0_12px_rgba(0,243,255,0.2)]",
              }}
              inactiveProps={{
                className: "text-muted-foreground border-transparent hover:text-foreground",
              }}
              className="rounded-lg border px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu trigger on the left for small screens */}
        <div className="lg:hidden flex items-center">
          <Button variant="ghost" size="icon" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            <Menu />
          </Button>
        </div>

        {/* Center: BIG Prominent Logo */}
        <div className="flex-1 flex justify-center items-center">
          <Link to="/" className="flex flex-col sm:flex-row items-center gap-2 group py-1">
            <img
              src="/logo.png"
              alt="CyberTech Hunter Academy Logo"
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
          <Link to="/faq" aria-label="FAQ" title="Frequently Asked Questions">
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-neon-cyan" />
            </Button>
          </Link>
          <div ref={calRef} className="relative hidden sm:inline-flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Calendar"
              aria-expanded={calOpen}
              onClick={() => {
                setCalOpen((v) => !v);
                setNotifOpen(false);
              }}
            >
              <CalendarDays className={calOpen ? "text-neon-cyan" : "text-muted-foreground"} />
            </Button>
            {calOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-neon-cyan/25 bg-background/95 p-4 shadow-[0_0_30px_-6px_rgba(0,243,255,0.35)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setCalOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-neon-cyan/10 hover:text-neon-cyan"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
                    {format(today, "MMMM yyyy")}
                  </span>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setCalOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-neon-cyan/10 hover:text-neon-cyan"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEKDAYS.map((d, i) => (
                    <span
                      key={i}
                      className="pb-1 text-[10px] font-bold uppercase text-muted-foreground"
                    >
                      {d}
                    </span>
                  ))}
                  {cells.map((day, i) =>
                    day === 0 ? (
                      <span key={`empty-${i}`} />
                    ) : (
                      <span
                        key={day}
                        className={`grid h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors ${day === today.getDate()
                            ? "bg-neon-cyan/20 font-bold text-neon-cyan ring-1 ring-inset ring-neon-cyan/40"
                            : "text-foreground hover:bg-neon-cyan/10"
                          }`}
                      >
                        {day}
                      </span>
                    ),
                  )}
                </div>
                <p className="mt-3 border-t border-border/50 pt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                  Today: {format(today, "EEE, MMM d")}
                </p>
              </div>
            )}
          </div>

          <div ref={notifRef} className="relative hidden sm:inline-flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Alerts"
              aria-expanded={notifOpen}
              onClick={() => {
                setNotifOpen((v) => !v);
                setCalOpen(false);
              }}
            >
              <Bell className={notifOpen ? "text-neon-amber" : "text-muted-foreground"} />
            </Button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-neon-amber/25 bg-background/95 p-4 shadow-[0_0_30px_-6px_rgba(250,204,21,0.3)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
                    Notifications
                  </span>
                  <span className="rounded-full bg-neon-amber/15 px-2 py-0.5 text-[10px] font-bold text-neon-amber">
                    {notifications.length} new
                  </span>
                </div>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                    <Bell className="mb-3 h-8 w-8 opacity-30" />
                    <p className="text-sm">You're all caught up.</p>
                    <p className="text-xs opacity-70">
                      {user === undefined ? "Loading alerts..." : "New alerts will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-border/70 bg-background/40 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-neon-amber">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {user ? (
            <Link
              to="/profile"
              className="group flex items-center gap-2 rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-1 transition-colors hover:border-neon-cyan/60 hover:bg-neon-cyan/20"
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-neon-purple/25 font-display text-[10px] font-bold uppercase text-neon-purple">
                {user.name?.substring(0, 2)}
              </span>
              <span className="hidden max-w-24 truncate font-display text-xs font-semibold uppercase tracking-wider text-neon-cyan sm:inline">
                {user.name?.split(" ")[0] || "Hunter"}
              </span>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="neon" size="sm" className="font-display tracking-wider">
                <Shield className="w-4 h-4" /> Sign in
              </Button>
            </Link>
          )}
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
      <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <Link to="/courses" className="hover:text-neon-cyan transition-colors">
          Courses
        </Link>
        <Link to="/pricing" className="hover:text-neon-cyan transition-colors">
          Hunter Pass
        </Link>
        <Link to="/faq" className="hover:text-neon-cyan transition-colors">
          FAQ
        </Link>
        <Link to="/support" className="hover:text-neon-cyan transition-colors">
          Support
        </Link>
      </nav>
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
