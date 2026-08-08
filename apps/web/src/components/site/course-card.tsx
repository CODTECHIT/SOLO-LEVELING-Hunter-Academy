import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Play, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CourseLike = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  type: "FULL" | "MODULE";
  thumbnail?: string | null;
  category: { id: string; name: string };
  lessons: { id: string }[];
};

export type CourseTone = "cyan" | "amber" | "purple";

const toneCss: Record<
  CourseTone,
  { var: string; badge: string; chip: string; price: string; btn: string; check: string }
> = {
  cyan: {
    var: "var(--neon-cyan)",
    badge: "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan",
    chip: "text-neon-cyan",
    price: "text-neon-cyan glow-text",
    btn: "border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_28px_-6px_color-mix(in_oklab,var(--neon-cyan)_80%,transparent)]",
    check: "text-neon-cyan",
  },
  amber: {
    var: "var(--neon-amber)",
    badge: "border-neon-amber/30 bg-neon-amber/10 text-neon-amber",
    chip: "text-neon-amber",
    price: "text-neon-amber glow-text",
    btn: "border-neon-amber/50 text-neon-amber hover:bg-neon-amber/10 hover:shadow-[0_0_28px_-6px_color-mix(in_oklab,var(--neon-amber)_80%,transparent)]",
    check: "text-neon-amber",
  },
  purple: {
    var: "var(--neon-purple)",
    badge: "border-neon-purple/30 bg-neon-purple/10 text-neon-purple",
    chip: "text-neon-purple",
    price: "text-neon-purple glow-text",
    btn: "border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10 hover:shadow-[0_0_28px_-6px_color-mix(in_oklab,var(--neon-purple)_80%,transparent)]",
    check: "text-neon-purple",
  },
};

export function CourseCard({
  course,
  tone = "cyan",
  ctaLabel,
  benefits,
  enrolled,
}: {
  course: CourseLike;
  tone?: CourseTone;
  ctaLabel?: string;
  benefits?: string[];
  enrolled?: boolean;
}) {
  const t = toneCss[tone];
  const isModule = course.type === "MODULE";

  return (
    <article
      style={{ "--c": t.var } as CSSProperties}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 backdrop-blur transition-all duration-300",
        "hover:-translate-y-1.5 hover:border-[color-mix(in_oklab,var(--c)_60%,transparent)]",
        "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--c)_50%,transparent),0_0_36px_-8px_color-mix(in_oklab,var(--c)_65%,transparent)]",
        "active:translate-y-0 active:scale-[0.99]",
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface to-background">
            <div aria-hidden className="grid-runes absolute inset-0 opacity-15" />
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--c)_14%,transparent)] blur-2xl"
            />
            <PlayCircle
              className={cn(
                "absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 opacity-40 drop-shadow-[0_0_12px_color-mix(in_oklab,var(--c)_60%,transparent)]",
                t.chip,
              )}
            />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
              t.badge,
            )}
          >
            {course.category.name}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-display font-bold uppercase tracking-widest ring-1 ring-inset",
              isModule
                ? "border-neon-amber/40 bg-neon-amber/10 text-neon-amber ring-neon-amber/40"
                : "border-neon-purple/40 bg-neon-purple/10 text-neon-purple ring-neon-purple/40",
            )}
          >
            {isModule ? "Module" : "Full Course"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/50 px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
            <Play className={cn("h-3 w-3", t.chip)} />
            {course.lessons.length} Lessons
          </span>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-foreground">
          {course.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {course.description}
        </p>

        {benefits && benefits.length > 0 && (
          <ul className="mt-4 space-y-2">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", t.check)} />
                {b}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto space-y-3 pt-6">
          {enrolled ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-neon-lime/40 bg-neon-lime/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-neon-lime">
              <CheckCircle2 className="h-3 w-3" />
              Enrolled
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-3">
              <div className={cn("font-display text-2xl font-bold", t.price)}>
                ₹{course.price.toLocaleString("en-IN")}
              </div>
              <div className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                {isModule ? "one-time unlock" : "complete pathway"}
              </div>
            </div>
          )}
          <Button
            asChild
            variant="neon"
            size="lg"
            style={{ whiteSpace: "normal" }}
            className={cn("h-11 w-full text-center leading-tight", t.btn)}
          >
            <Link
              to={enrolled ? "/learn/$courseId" : "/courses/$slug"}
              params={enrolled ? { courseId: course.slug } : { slug: course.slug }}
            >
              {enrolled ? "Continue Learning" : (ctaLabel ?? "Start Your Awakening")}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
