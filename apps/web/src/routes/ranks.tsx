import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Zap,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronDown,
  Target,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { getCurrentUserFn } from "@/server/auth";
import { getHunterStatsFn } from "@/server/courses";

export const Route = createFileRoute("/ranks")({
  loader: async () => {
    try {
      const user = await getCurrentUserFn();
      if (user) {
        const stats = await getHunterStatsFn();
        return { user, stats };
      }
    } catch {
      // Guest view
    }
    return { user: null, stats: null };
  },
  head: () => ({
    meta: [
      { title: "Hunter Rank System & Progression Guide — Cyber Tech Academy" },
      {
        name: "description",
        content:
          "Understand the Cyber Tech Hunter ranking hierarchy (E to S Rank), EXP formulas, focus HP, and daily streak MP mechanics.",
      },
    ],
  }),
  component: RankExplanationPage,
});

const RANK_TIERS = [
  {
    letter: "E",
    name: "Novice Hunter",
    range: "0 – 999 EXP",
    accent: "slate",
    borderClass: "border-slate-700/60 hover:border-slate-500",
    glowClass: "text-slate-300",
    badgeBg: "bg-slate-800/80 text-slate-300 border-slate-700",
    description: "The awakening phase. Every student starts here, building foundational knowledge and acquiring basic combat skills.",
    perks: [
      "Access to all enrolled beginner dungeons",
      "Standard community support",
      "Basic Hunter Profile & EXP Tracker",
    ],
    recommendedCourses: "Foundation modules & introductory crash courses.",
  },
  {
    letter: "D",
    name: "Initiate Hunter",
    range: "1,000 – 2,999 EXP",
    accent: "cyan",
    borderClass: "border-neon-cyan/40 hover:border-neon-cyan",
    glowClass: "text-neon-cyan glow-text",
    badgeBg: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40",
    description: "First dungeon raids completed. You grasp the core architectures and can execute standard technical challenges.",
    perks: [
      "D-Rank Hunter insignia on verified certificates",
      "Access to intermediate dungeon modules",
      "Unlocked Academy leaderboards entry",
    ],
    recommendedCourses: "Intermediate core syllabus & module certifications.",
  },
  {
    letter: "C",
    name: "Adept Hunter",
    range: "3,000 – 6,999 EXP",
    accent: "lime",
    borderClass: "border-neon-lime/40 hover:border-neon-lime",
    glowClass: "text-neon-lime glow-text",
    badgeBg: "bg-neon-lime/10 text-neon-lime border-neon-lime/40",
    description: "Solid technical mastery. You build real-world systems, pass timed dungeon exams, and sustain consistent daily focus.",
    perks: [
      "C-Rank Adept badge & elevated leaderboard ranking",
      "Eligible for course review verified highlights",
      "Access to specialized dungeon raid tracks",
    ],
    recommendedCourses: "Full stack tracks & production deployment modules.",
  },
  {
    letter: "B",
    name: "Elite Hunter",
    range: "7,000 – 14,999 EXP",
    accent: "amber",
    borderClass: "border-neon-amber/40 hover:border-neon-amber",
    glowClass: "text-neon-amber glow-text",
    badgeBg: "bg-neon-amber/10 text-neon-amber border-neon-amber/40",
    description: "High-tier dungeon conqueror. Capable of architecting complex systems and solving deep engineering bottlenecks.",
    perks: [
      "Elite B-Rank gold credential watermark on certificates",
      "Priority customer & mentor ticket handling",
      "Invitations to private guild masterclasses",
    ],
    recommendedCourses: "High-scale backend, distributed systems & cloud architecture.",
  },
  {
    letter: "A",
    name: "Veteran Hunter",
    range: "15,000 – 29,999 EXP",
    accent: "purple",
    borderClass: "border-neon-purple/50 hover:border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    glowClass: "text-neon-purple glow-text",
    badgeBg: "bg-neon-purple/15 text-neon-purple border-neon-purple/50",
    description: "Master level practitioner. You guide other hunters, conquer the most demanding exams, and showcase near-pinnacle mastery.",
    perks: [
      "A-Rank Veteran insignia & profile highlight",
      "Exclusive 1-on-1 mentorship & code reviews",
      "Top 5% Academy leaderboard honors",
    ],
    recommendedCourses: "Advanced specialized masteries, security & enterprise engineering.",
  },
  {
    letter: "S",
    name: "Legendary Monarch",
    range: "30,000+ EXP",
    accent: "purple",
    borderClass: "border-gradient-to-r border-rose-500/80 hover:border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] bg-gradient-to-b from-rose-950/20 via-surface to-surface",
    glowClass: "text-rose-400 glow-text",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/60",
    description: "The absolute pinnacle of the Academy. Flawless mastery across all dungeon paths, revered throughout the Hunter guild.",
    perks: [
      "Permanent S-Rank Monarch Seal on all certificates",
      "Direct honorary recognition in Academy Hall of Fame",
      "Direct access to Guild Master events & career referrals",
    ],
    recommendedCourses: "All comprehensive tracks, zero-to-hero archives & research.",
  },
];

const EXP_SOURCES = [
  {
    icon: BookOpen,
    title: "Course Enrollment",
    amount: "+50 EXP",
    color: "text-neon-cyan",
    bgColor: "bg-neon-cyan/10 border-neon-cyan/30",
    desc: "Granted immediately when you register or unlock any full course or Hunter Pass module.",
  },
  {
    icon: Zap,
    title: "Lesson Mastered",
    amount: "+25 EXP",
    color: "text-neon-lime",
    bgColor: "bg-neon-lime/10 border-neon-lime/30",
    desc: "Awarded automatically every time you complete and mark a video training module as finished.",
  },
  {
    icon: Award,
    title: "100% Course Certificate",
    amount: "+200 EXP",
    color: "text-neon-amber",
    bgColor: "bg-neon-amber/10 border-neon-amber/30",
    desc: "A massive milestone bonus awarded upon completing 100% of a course's lessons and claiming your verified certificate.",
  },
  {
    icon: Trophy,
    title: "Quiz / Dungeon Exam",
    amount: "+50 EXP",
    color: "text-neon-purple",
    bgColor: "bg-neon-purple/10 border-neon-purple/30",
    desc: "Earned by passing a timed module quiz with a passing score, proving your theoretical mastery.",
  },
];

const FAQS = [
  {
    q: "Does my rank decrease if I take a break?",
    a: "No! Your earned EXP and rank are permanent achievements that will never decrease. However, your Daily Study Streak (MP) will reset to zero if a calendar day is missed.",
  },
  {
    q: "What is the difference between HP (Focus) and MP (Streak)?",
    a: "HP (Focus) measures your total study completion and watch depth across all enrolled courses (weighted by actual lesson duration). MP (Streak) is powered by consecutive daily learning; 7 consecutive study days puts your MP into 100% Overdrive.",
  },
  {
    q: "Can I jump multiple ranks at once?",
    a: "Yes! As soon as your total accumulated EXP crosses the threshold for a higher tier (e.g., jumping from 800 EXP to 1,200 EXP), your rank immediately upgrades in real time.",
  },
  {
    q: "Do certificates display my current rank?",
    a: "Yes, certificates issued at 100% course completion feature your official student credentials and verification hash recorded in the Academy ledger.",
  },
];

function RankExplanationPage() {
  const { user, stats } = Route.useLoaderData();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Simulator State
  const [simCourses, setSimCourses] = useState(2);
  const [simLessons, setSimLessons] = useState(15);
  const [simCertificates, setSimCertificates] = useState(1);
  const [simQuizzes, setSimQuizzes] = useState(2);

  const calculatedExp =
    simCourses * 50 +
    simLessons * 25 +
    simCertificates * 200 +
    simQuizzes * 50;

  const simRank =
    RANK_TIERS.slice()
      .reverse()
      .find((t) => {
        if (t.letter === "S") return calculatedExp >= 30000;
        if (t.letter === "A") return calculatedExp >= 15000;
        if (t.letter === "B") return calculatedExp >= 7000;
        if (t.letter === "C") return calculatedExp >= 3000;
        if (t.letter === "D") return calculatedExp >= 1000;
        return true;
      }) || RANK_TIERS[0];

  return (
    <PageShell
      title="Hunter Rank & Awakening System"
      subtitle="The complete guide to EXP calculation, rank tiers (E to S Rank), focus HP, and daily study streak MP."
    >
      <div className="mx-auto max-w-6xl space-y-12 pb-16">
        {/* 1. Logged-in User Current Status Banner (if active) */}
        {user && stats && (
          <Panel accent="purple" className="relative overflow-hidden p-6 sm:p-8 bg-surface-2/80">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-xs font-mono font-bold text-neon-purple">
                  <Sparkles className="h-3.5 w-3.5" />
                  CURRENT ACTIVE HUNTER STATUS
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  Hunter {user.name}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  You are currently holding the title of{" "}
                  <strong className="text-neon-cyan">{stats.rankName} ({stats.rankLetter}-Rank)</strong> with{" "}
                  <span className="font-mono text-neon-purple font-bold">{stats.expTotal.toLocaleString()} Total EXP</span>.
                </p>
              </div>

              {/* Badges Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 sm:flex-initial">
                  {/* Rank Badge */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-neon-cyan/40 bg-surface p-2.5 sm:px-4 sm:py-3 shadow-lg">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-neon-cyan/15 font-display text-xl sm:text-2xl font-bold text-neon-cyan glow-text border border-neon-cyan/40">
                      {stats.rankLetter}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold truncate">
                        Current Rank
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-foreground truncate">{stats.rankName}</div>
                    </div>
                  </div>

                  {/* Streak Badge */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-neon-amber/40 bg-surface p-2.5 sm:px-4 sm:py-3 shadow-lg">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-neon-amber/15 text-xl sm:text-2xl border border-neon-amber/40">
                      🔥
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold truncate">
                        Daily Streak
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-neon-amber font-mono truncate">
                        {stats.streak} Day{stats.streak === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Rank CTA */}
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button variant="neon" size="sm" className="h-10 sm:h-12 w-full px-4 text-xs uppercase tracking-wider font-semibold">
                    Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div className="mt-6 space-y-1.5 pt-4 border-t border-border/60">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">
                  Tier Progress ({stats.expCurrent.toLocaleString()} / {stats.expMax.toLocaleString()} EXP)
                </span>
                <span className="text-neon-purple font-bold">
                  {Math.min(100, Math.round((stats.expCurrent / stats.expMax) * 100))}% Completed
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-surface overflow-hidden border border-border p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-purple/70 via-neon-cyan to-white transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, Math.round((stats.expCurrent / stats.expMax) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </Panel>
        )}

        {/* 2. Overview: How Ranks Work */}
        <section className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3.5 py-1 text-xs font-mono font-bold text-neon-cyan">
            <Shield className="h-3.5 w-3.5" />
            THE RANKING LADDER
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Six Tiers of Hunter Awakening
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Every lesson completed, course conquered, and quiz passed injects pure EXP into your hunter soul. 
            Ascend through the 6 recognized guild ranks to claim exclusive privileges and academy prestige.
          </p>
        </section>

        {/* 3. The 6 Rank Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {RANK_TIERS.map((tier) => (
            <div
              key={tier.letter}
              className={`rounded-2xl border ${tier.borderClass} bg-surface-2/70 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl border font-display text-2xl font-bold ${tier.badgeBg}`}>
                    {tier.letter}
                  </span>
                  <span className="font-mono text-xs font-bold text-muted-foreground border border-border px-2.5 py-1 rounded-full bg-surface">
                    {tier.range}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                {/* Perks */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Rank Privileges
                  </div>
                  <ul className="space-y-1.5 text-xs text-foreground/90">
                    {tier.perks.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-neon-lime shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Courses Footer */}
              <div className="mt-5 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Ideal For:</span> {tier.recommendedCourses}
              </div>
            </div>
          ))}
        </div>

        {/* 4. EXP Formula Breakdown (The 4 Ways to Earn EXP) */}
        <section className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon-lime/40 bg-neon-lime/10 px-3.5 py-1 text-xs font-mono font-bold text-neon-lime">
              <Zap className="h-3.5 w-3.5" />
              EXP FORMULA
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              How You Gain Experience (EXP)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              EXP is rewarded automatically through real learning actions. No grinding fluff—just pure progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXP_SOURCES.map((src, i) => {
              const Icon = src.icon;
              return (
                <Panel key={i} className="space-y-3 p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${src.bgColor}`}>
                        <Icon className={`h-5 w-5 ${src.color}`} />
                      </div>
                      <span className={`font-mono text-lg font-bold ${src.color}`}>
                        {src.amount}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm">
                        {src.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {src.desc}
                      </p>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        </section>

        {/* 5. HP Focus & Daily Streak MP Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* HP Focus Card */}
          <Panel accent="lime" className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-neon-lime/20 border border-neon-lime flex items-center justify-center font-display font-bold text-neon-lime">
                HP
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  HP • Focus Retention
                </h3>
                <p className="text-xs text-muted-foreground">Study depth & comprehensive video coverage</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your <strong>HP (Health Points)</strong> reflects your true learning focus. It measures the exact percentage of lesson video duration you have watched and absorbed across all your enrolled courses. 
              Skimming or skipping lowers your Focus HP, while thorough watching charges your Focus to 100%.
            </p>
            <div className="rounded-xl border border-neon-lime/30 bg-surface p-3 text-xs text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-neon-lime shrink-0" />
              <span>Aim for <strong>90%+ Focus HP</strong> to ensure total mastery before taking certification exams.</span>
            </div>
          </Panel>

          {/* MP Streak Card */}
          <Panel accent="purple" className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-neon-purple/20 border border-neon-purple flex items-center justify-center font-display font-bold text-neon-purple text-lg">
                🔥
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  MP • Daily Study Streaks
                </h3>
                <p className="text-xs text-muted-foreground">Daily momentum & consecutive study overdrive</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your <strong>MP (Mana Points)</strong> represents your daily study rhythm. Every day you watch a lesson or complete training, your daily streak counter increments. 
              Reaching <strong>7 consecutive days</strong> unlocks full 100% MP Overdrive, fueling maximum EXP efficiency!
            </p>
            <div className="rounded-xl border border-neon-purple/30 bg-surface p-3 text-xs text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-neon-purple shrink-0" />
              <span>Study at least one lesson per day to keep your streak flame burning strong!</span>
            </div>
          </Panel>
        </div>

        {/* 6. Interactive Rank Simulator */}
        <Panel accent="cyan" className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-neon-cyan uppercase">
                <Sliders className="h-3.5 w-3.5" />
                INTERACTIVE CALCULATOR
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mt-1">
                Simulate Your Hunter Rank
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adjust the sliders below to see what rank you will achieve based on your planned training goals.
              </p>
            </div>

            {/* Projected Result Box */}
            <div className="flex items-center gap-4 rounded-2xl border border-neon-cyan/50 bg-background/80 px-5 py-3 shadow-lg">
              <div className={`h-12 w-12 rounded-xl border flex items-center justify-center font-display text-2xl font-bold ${simRank.badgeBg}`}>
                {simRank.letter}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Projected Rank
                </div>
                <div className="font-display text-base font-bold text-neon-cyan">
                  {simRank.name}
                </div>
                <div className="font-mono text-xs text-foreground">
                  {calculatedExp.toLocaleString()} Total EXP
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Courses Slider */}
            <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Enrolled Courses (+50)</span>
                <span className="text-neon-cyan font-mono">{simCourses}</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={simCourses}
                onChange={(e) => setSimCourses(Number(e.target.value))}
                className="w-full accent-neon-cyan cursor-pointer"
              />
              <div className="text-[11px] text-muted-foreground">
                Yields: <strong className="text-foreground">+{simCourses * 50} EXP</strong>
              </div>
            </div>

            {/* Lessons Slider */}
            <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Lessons Completed (+25)</span>
                <span className="text-neon-lime font-mono">{simLessons}</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={simLessons}
                onChange={(e) => setSimLessons(Number(e.target.value))}
                className="w-full accent-neon-lime cursor-pointer"
              />
              <div className="text-[11px] text-muted-foreground">
                Yields: <strong className="text-foreground">+{simLessons * 25} EXP</strong>
              </div>
            </div>

            {/* Certifications Slider */}
            <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Certificates (+200)</span>
                <span className="text-neon-amber font-mono">{simCertificates}</span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                value={simCertificates}
                onChange={(e) => setSimCertificates(Number(e.target.value))}
                className="w-full accent-neon-amber cursor-pointer"
              />
              <div className="text-[11px] text-muted-foreground">
                Yields: <strong className="text-foreground">+{simCertificates * 200} EXP</strong>
              </div>
            </div>

            {/* Quizzes Slider */}
            <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Passed Quizzes (+50)</span>
                <span className="text-neon-purple font-mono">{simQuizzes}</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={simQuizzes}
                onChange={(e) => setSimQuizzes(Number(e.target.value))}
                className="w-full accent-neon-purple cursor-pointer"
              />
              <div className="text-[11px] text-muted-foreground">
                Yields: <strong className="text-foreground">+{simQuizzes * 50} EXP</strong>
              </div>
            </div>
          </div>
        </Panel>

        {/* 7. Frequently Asked Questions */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-mono font-bold text-neon-cyan">
              <HelpCircle className="h-3.5 w-3.5" />
              CLARIFICATIONS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Rank System FAQs
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-border/80"
              >
                <button
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-foreground hover:bg-background/40"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ml-2 ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-muted-foreground text-xs sm:text-sm border-t border-border/40 bg-background/30 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 8. Bottom Call to Action */}
        <div className="rounded-3xl border border-neon-purple/50 bg-gradient-to-r from-neon-purple/10 via-surface to-neon-cyan/10 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Ready to Begin Your Ascension?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Enter the academy dungeons today, complete hands-on lessons, and claim your verified certificates.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/courses">
              <Button variant="neon" size="lg" className="px-8">
                Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="px-8">
                  My Student Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/signup">
                <Button variant="outline" size="lg" className="px-8">
                  Register as Hunter
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
