import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HunterHero({
  eyebrow,
  title,
  subtitle,
  cta,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-neon-cyan/25 bg-surface/50 px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16",
        className,
      )}
    >
      <div aria-hidden className="grid-runes absolute inset-0 opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-neon-purple/20 blur-3xl sm:h-72 sm:w-72"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-neon-cyan/15 blur-3xl sm:h-72 sm:w-72"
      />
      <div className="relative z-10 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.25em] text-neon-cyan sm:text-xs">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
          {eyebrow}
        </span>
        <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-wide text-foreground text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base lg:text-lg">
          {subtitle}
        </p>
        {cta && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">{cta}</div>}
      </div>
    </section>
  );
}
