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
import {
  getNotificationsFn,
  markAllNotificationsReadFn,
} from "@/server/notifications";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/ranks", label: "Rank System" },
  { to: "/pricing", label: "Hunter Pass" },
  { to: "/faq", label: "FAQ" },
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const today = new Date();
  const totalDays = getDaysInMonth(today);
  const startWeekday = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const cells = [
    ...Array<number>(startWeekday).fill(0),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const loadNotifications = () => {
    getNotificationsFn()
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  };

  useEffect(() => {
    getCurrentUserFn()
      .then(setUser)
      .catch(() => setUser(null));
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadFn();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

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
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left Side: Logo & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Mobile menu trigger */}
          <div className="lg:hidden flex items-center shrink-0">
            <Button variant="ghost" size="icon" aria-label="Menu" className="h-9 w-9 p-0 text-foreground" onClick={() => setOpen((v) => !v)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group py-0.5 min-w-0">
            <img
              src="/logo.png"
              alt="CyberTech Hunter Academy Logo"
              className="h-8 sm:h-12 w-auto shrink-0 object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_14px_rgba(0,243,255,0.45)]"
            />
            <div className="min-w-0">
              <span className="block font-display text-xs sm:text-base font-black tracking-wider sm:tracking-widest text-neon uppercase leading-none truncate">
                Cyber Tech
              </span>
              <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.3em] text-neon-cyan/80 font-bold mt-0.5 truncate">
                Hunter Academy
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 mx-auto">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{
                className:
                  "text-neon-cyan border-neon-cyan/50 bg-neon-cyan/10 shadow-[0_0_12px_rgba(0,243,255,0.25)] font-bold",
              }}
              inactiveProps={{
                className: "text-muted-foreground border-transparent hover:text-foreground hover:bg-surface-2/60",
              }}
              className="rounded-xl border px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition-all duration-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right Side: Action Buttons & User Profile */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          <Link to="/faq" aria-label="FAQ" title="Frequently Asked Questions" className="hidden sm:inline-flex">
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
              className="relative"
              onClick={() => {
                setNotifOpen((v) => !v);
                setCalOpen(false);
              }}
            >
              <Bell className={notifOpen ? "text-neon-amber" : "text-muted-foreground"} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-amber opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-amber shadow-[0_0_8px_#f59e0b]"></span>
                </span>
              )}
            </Button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-84 rounded-2xl border border-neon-amber/25 bg-background/95 p-4 shadow-[0_0_30px_-6px_rgba(250,204,21,0.3)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-neon-amber" />
                    Notifications
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-neon-amber/15 px-2 py-0.5 text-[10px] font-bold text-neon-amber">
                        {unreadCount} new
                      </span>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-muted-foreground hover:text-neon-amber transition-colors underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
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
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          n.read
                            ? "border-border/60 bg-background/30 opacity-75"
                            : "border-neon-amber/40 bg-neon-amber/5 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${n.read ? "text-foreground" : "text-neon-amber"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(n.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.message}</p>
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
              className="group flex items-center gap-1.5 sm:gap-2 rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-1 transition-colors hover:border-neon-cyan/60 hover:bg-neon-cyan/20 shrink-0"
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-neon-purple/25 font-display text-[10px] font-bold uppercase text-neon-purple">
                {user.name?.substring(0, 2)}
              </span>
              <span className="hidden max-w-24 truncate font-display text-xs font-semibold uppercase tracking-wider text-neon-cyan sm:inline">
                {user.name?.split(" ")[0] || "Hunter"}
              </span>
            </Link>
          ) : (
            <Link to="/login" className="shrink-0">
              <Button variant="neon" size="sm" className="font-display tracking-wider text-xs px-2.5 py-1 sm:px-3 sm:py-2 h-8 sm:h-9">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Sign in
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
        <Link to="/privacy-policy" className="hover:text-neon-cyan transition-colors">
          Privacy Policy
        </Link>
        <Link to="/support" className="hover:text-neon-cyan transition-colors">
          Support
        </Link>
      </nav>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-xs">
        <span>© {new Date().getFullYear()} Cyber Tech Academy — Arise, Hunter.</span>
        <span className="hidden sm:inline text-muted-foreground/40">•</span>
        <span>
          Designed by{" "}
          <a
            href="https://codtechitsolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-neon-cyan hover:underline transition-colors hover:text-white"
          >
            CODTECH IT Solutions
          </a>
        </span>
      </div>
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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-xl sm:text-3xl font-bold uppercase tracking-tight sm:tracking-[0.12em] text-neon leading-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
