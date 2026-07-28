import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Lock, Maximize2, Pause, Play, SkipForward, Volume2 } from "lucide-react";
import { TopNav, SiteFooter } from "@/components/site/nav";
import {
  Panel,
  PanelTitle,
  RankBadge,
  StatRing,
  StatusTag,
  XPBar,
} from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { achievements, enrolledCourses, hunter, weeklyActivity } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hunter Dashboard — Solo Leveling Academy" },
      {
        name: "description",
        content:
          "Track XP, course progress, achievements and your current lesson inside the Solo Leveling Academy hunter dashboard.",
      },
      { property: "og:title", content: "Hunter Dashboard — Solo Leveling Academy" },
      {
        property: "og:description",
        content: "Level up your learning with XP bars, ranks and AI-assisted courses.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="sr-only">Hunter Dashboard</h1>

        {/* Profile */}
        <Panel className="mb-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="animate-pulse-glow grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-neon-purple/60 bg-surface-2 font-display text-xl font-bold text-neon-cyan">
                SJ
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="truncate font-display text-lg font-bold text-foreground sm:text-xl">
                    {hunter.name}
                  </h2>
                  <RankBadge rank={hunter.rank} />
                </div>
                <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">
                  Level {hunter.level} · {hunter.title}
                </p>
              </div>
            </div>
            <div className="w-full min-w-0 space-y-2 sm:w-80">
              <div className="flex items-center justify-between font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>EXP</span>
                <span className="text-neon-lime">
                  {hunter.xp.toLocaleString("en-IN")} / {hunter.xpMax.toLocaleString("en-IN")}
                </span>
              </div>
              <XPBar value={hunter.xp} max={hunter.xpMax} accent="purple" />
              <div className="grid grid-cols-2 gap-3">
                <XPBar value={hunter.hp} label="HP · Focus" accent="lime" />
                <XPBar value={hunter.mp} label="MP · Streak" accent="cyan" />
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Video player */}
            <Panel accent="cyan" className="p-0">
              <div className="flex items-center justify-between border-b border-neon-cyan/25 px-5 py-3">
                <h3 className="truncate font-display text-xs uppercase tracking-[0.2em] text-neon-cyan glow-text">
                  Advanced Dungeon Strategy
                </h3>
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
                  EP. 07
                </span>
              </div>
              <div className="relative aspect-video w-full overflow-hidden bg-background/70">
                <div className="grid-runes absolute inset-0 opacity-40" />
                <div className="absolute inset-0 grid place-items-center">
                  <button
                    aria-label="Play lesson"
                    className="animate-pulse-glow grid h-20 w-20 place-items-center rounded-full border border-neon-cyan/60 bg-surface/70 text-neon-cyan transition-transform hover:scale-105"
                  >
                    <Play className="!size-8" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4">
                <XPBar value={49} accent="cyan" />
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <Play className="size-4 text-neon-lime" />
                  <Pause className="size-4" />
                  <SkipForward className="size-4" />
                  <Volume2 className="size-4" />
                  <span className="font-display text-xs">0:12:45 / 0:25:34</span>
                  <span className="ml-auto flex items-center gap-3 text-xs">
                    <span className="rounded border border-border px-2 py-0.5">1.25x</span>
                    <span className="rounded border border-border px-2 py-0.5">CC</span>
                    <Maximize2 className="size-4" />
                  </span>
                </div>
              </div>
            </Panel>

            {/* Analytics + achievements */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Panel>
                <PanelTitle>Course Analytics</PanelTitle>
                <div className="flex items-center justify-around gap-4">
                  <StatRing value={hunter.hoursStudied} label="Hours Studied" accent="purple" />
                  <StatRing value={hunter.completion} label="Completion" accent="cyan" />
                </div>
              </Panel>

              <Panel accent="lime">
                <PanelTitle>Level Up Achievements</PanelTitle>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((a) => (
                    <div
                      key={a.name}
                      className={`hover-glow rounded-xl border p-3 text-center ${
                        a.unlocked
                          ? "border-neon-lime/50 bg-neon-lime/5"
                          : "border-border/60 bg-background/40 opacity-55"
                      }`}
                    >
                      <div
                        className={`text-2xl ${a.unlocked ? "text-neon-lime" : "text-muted-foreground"}`}
                      >
                        {a.unlocked ? a.glyph : "🔒"}
                      </div>
                      <p className="mt-1 truncate font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                        {a.name}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Weekly activity */}
            <Panel>
              <PanelTitle
                right={<span className="text-[10px] text-muted-foreground">56h 32m</span>}
              >
                Weekly Activity
              </PanelTitle>
              <div className="flex h-36 items-end gap-3">
                {weeklyActivity.map((d) => (
                  <div
                    key={d.day}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div
                      className="w-full rounded-t-md bg-neon-cyan/80"
                      style={{
                        height: `${(d.hours / 8) * 100}%`,
                        boxShadow: "0 0 16px -3px var(--neon-cyan)",
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Panel accent="cyan">
              <PanelTitle>AI Teacher Assistant</PanelTitle>
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-neon-cyan/50 bg-surface-2 text-neon-cyan">
                  <Bot />
                </div>
                <div className="min-w-0 rounded-2xl rounded-tl-sm border border-neon-cyan/30 bg-background/60 p-3 text-sm">
                  <p className="font-display text-xs uppercase tracking-wider text-neon-cyan">
                    Alex
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Ready to level up your dungeon strategy, Jin-Woo? You're 1 XP from Level 101.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  placeholder="Ask the system anything…"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background/70 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-neon-cyan/70"
                />
                <Button variant="hero" size="sm" className="h-10">
                  Send
                </Button>
              </div>
            </Panel>

            <Panel>
              <PanelTitle right={<Lock className="size-3.5 text-muted-foreground" />}>
                Enrolled Courses
              </PanelTitle>
              <ul className="space-y-3">
                {enrolledCourses.map((c) => (
                  <li
                    key={c.title}
                    className="hover-glow rounded-xl border border-border/70 bg-background/40 p-3"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <p className="truncate font-display text-sm text-foreground">{c.title}</p>
                      <StatusTag status={c.status} />
                    </div>
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.level}
                    </p>
                    <XPBar
                      value={c.progress}
                      accent={
                        c.status === "Completed" ? "lime" : c.status === "Locked" ? "pink" : "cyan"
                      }
                    />
                  </li>
                ))}
              </ul>
              <Link to="/catalog">
                <Button variant="neonPurple" className="mt-4 w-full">
                  Browse Catalog
                </Button>
              </Link>
            </Panel>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
