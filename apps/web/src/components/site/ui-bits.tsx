import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "purple" | "cyan" | "lime" | "pink" | "amber" | "slate";

const accentBorder: Record<Accent, string> = {
  purple: "panel",
  cyan: "panel-cyan",
  lime: "panel-lime",
  pink: "panel",
  amber: "panel-amber",
  slate: "panel-slate",
};

export function Panel({
  children,
  className,
  accent = "purple",
  hover,
}: {
  children: ReactNode;
  className?: string;
  accent?: Accent;
  hover?: boolean;
}) {
  return (
    <div className={cn(accentBorder[accent], hover && "hover-glow", "p-5", className)}>
      {children}
    </div>
  );
}

export function PanelTitle({
  children,
  className,
  right,
}: {
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3
        className={cn(
          "font-display text-xs uppercase tracking-[0.18em] text-neon-cyan glow-text sm:text-sm",
          className,
        )}
      >
        {children}
      </h3>
      {right}
    </div>
  );
}

export function RankBadge({ rank, className }: { rank: string; className?: string }) {
  const tone =
    rank === "S"
      ? "text-neon-amber border-neon-amber/60"
      : rank === "A"
        ? "text-neon-pink border-neon-pink/60"
        : rank === "B"
          ? "text-neon-purple border-neon-purple/60"
          : rank === "C"
            ? "text-neon-cyan border-neon-cyan/60"
            : "text-neon-lime border-neon-lime/60";
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-background/60 font-display text-[11px] font-bold",
        tone,
        className,
      )}
    >
      {rank}
    </span>
  );
}

export function StatusTag({ status }: { status: string }) {
  const tone =
    status === "Active" || status === "Completed"
      ? "text-neon-lime border-neon-lime/50 bg-neon-lime/10"
      : status === "Banned" || status === "Locked" || status === "Expired"
        ? "text-destructive border-destructive/50 bg-destructive/10"
        : "text-neon-amber border-neon-amber/50 bg-neon-amber/10";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-display text-[10px] uppercase tracking-wider",
        tone,
      )}
    >
      {status}
    </span>
  );
}

export function XPBar({
  value,
  max = 100,
  label,
  accent = "purple",
}: {
  value: number;
  max?: number;
  label?: string;
  accent?: Accent;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const fill =
    accent === "cyan"
      ? "bg-neon-cyan"
      : accent === "lime"
        ? "bg-neon-lime"
        : accent === "pink"
          ? "bg-neon-pink"
          : "bg-neon-purple";
  return (
    <div className="min-w-0">
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-display uppercase tracking-wider">{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full border border-border/70 bg-background/70">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{
            width: `${pct}%`,
            boxShadow: "0 0 14px -2px currentColor",
          }}
        />
      </div>
    </div>
  );
}

export function StatRing({
  value,
  label,
  accent = "cyan",
  size = 108,
}: {
  value: number;
  label: string;
  accent?: Accent;
  size?: number;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    accent === "purple"
      ? "var(--neon-purple)"
      : accent === "lime"
        ? "var(--neon-lime)"
        : accent === "pink"
          ? "var(--neon-pink)"
          : "var(--neon-cyan)";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * value) / 100}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold text-foreground">
          {value}%
        </span>
      </div>
      <span className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function Particles({ count = 22 }: { count?: number }) {
  const dots = Array.from({ length: count }, (_, i) => ({
    left: (i * 37) % 100,
    top: (i * 53) % 100,
    delay: (i % 7) * 0.8,
    size: 2 + (i % 4),
  }));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <span
          key={i}
          className="animate-particle absolute rounded-full bg-neon-cyan"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            boxShadow: "0 0 10px var(--neon-cyan)",
          }}
        />
      ))}
    </div>
  );
}

export function RuneCircle() {
  return (
    <div
      aria-hidden
      className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 opacity-30"
    >
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <circle
          cx="200"
          cy="200"
          r="190"
          fill="none"
          stroke="var(--neon-purple)"
          strokeWidth="0.8"
          strokeDasharray="6 10"
        />
        <circle cx="200" cy="200" r="150" fill="none" stroke="var(--neon-cyan)" strokeWidth="0.6" />
        <circle
          cx="200"
          cy="200"
          r="110"
          fill="none"
          stroke="var(--neon-purple)"
          strokeWidth="0.6"
          strokeDasharray="2 6"
        />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <text
              key={i}
              x={(200 + Math.cos(a) * 172).toFixed(2)}
              y={(200 + Math.sin(a) * 172).toFixed(2)}
              fill="var(--neon-cyan)"
              fontSize="11"
              textAnchor="middle"
              opacity="0.8"
            >
              {["ᚠ", "ᚱ", "ᛉ", "ᛟ", "ᚹ", "ᛗ"][i % 6]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="grid-runes absolute inset-0 opacity-60" aria-hidden />
      <RuneCircle />
      <Particles />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
