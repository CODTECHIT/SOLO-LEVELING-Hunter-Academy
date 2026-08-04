import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav, SiteFooter } from "@/components/site/nav";
import { Button } from "@/components/ui/button";
import { PlayCircle, Lock, Send, Bot, CheckCircle2, ChevronRight, Pause, Volume2, Maximize } from "lucide-react";
import { getCatalogFn } from "@/server/courses";
import { Panel } from "@/components/site/ui-bits";
import { HunterStatsBar } from "@/components/site/HunterStatsBar";

export const Route = createFileRoute("/")({
  loader: async () => {
    return await getCatalogFn();
  },
  head: () => ({
    meta: [
      { title: "Cyber Tech Academy — Master Cyber Security" },
      { name: "description", content: "Level up your skills with our elite courses." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { courses } = Route.useLoaderData();
  // Use up to 4 courses for the mock enrolled list
  const mockCourses = courses.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Mock Profile Header */}
        <Panel accent="purple" className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-2xl border border-neon-cyan bg-neon-cyan/10 flex items-center justify-center font-display text-2xl font-bold text-neon-cyan glow-text shadow-[0_0_15px_-3px_var(--neon-cyan)]">
              SJ
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-foreground tracking-wider">Cyber Tech</h1>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-amber/20 border border-neon-amber text-neon-amber text-xs font-bold font-display">S</span>
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">
                Level 100 • Shadow Monarch
              </p>
            </div>
          </div>

          <HunterStatsBar expCurrent={74999} expMax={75000} hpPercent={92} mpPercent={68} />
        </Panel>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Main Left Column */}
          <div className="flex flex-col gap-6">

            {/* Video Player Mockup */}
            <Panel accent="cyan" className="flex flex-col overflow-hidden bg-background">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="font-display font-bold uppercase tracking-widest text-neon-cyan text-sm">Advanced Dungeon Strategy</h2>
                <span className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">Ep. 07</span>
              </div>
              <div className="relative aspect-video bg-[#050810] flex items-center justify-center group overflow-hidden">
                {/* Fake Grid background for the video player empty state */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                <div className="relative z-10 w-20 h-20 rounded-full border-2 border-neon-cyan/50 bg-background/50 backdrop-blur flex items-center justify-center text-neon-cyan cursor-pointer hover:scale-110 transition-transform shadow-[0_0_30px_-5px_var(--neon-cyan)] group-hover:border-neon-cyan group-hover:bg-neon-cyan/10">
                  <PlayCircle className="w-8 h-8 ml-1" />
                </div>

                {/* Video Player Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-4 text-muted-foreground mb-3">
                    <PlayCircle className="w-5 h-5 hover:text-neon-cyan cursor-pointer transition-colors" />
                    <Volume2 className="w-5 h-5 hover:text-neon-cyan cursor-pointer transition-colors" />
                    <span className="text-xs font-mono ml-2">0:12:45 / 0:25:34</span>
                    <div className="flex-1" />
                    <span className="text-[10px] font-bold border border-muted-foreground/50 rounded px-1.5 py-0.5 hover:text-neon-cyan hover:border-neon-cyan cursor-pointer">1.25x</span>
                    <span className="text-[10px] font-bold border border-muted-foreground/50 rounded px-1.5 py-0.5 hover:text-neon-cyan hover:border-neon-cyan cursor-pointer">CC</span>
                    <Maximize className="w-4 h-4 hover:text-neon-cyan cursor-pointer transition-colors ml-2" />
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer">
                    <div className="h-full bg-neon-cyan relative" style={{ width: '50%' }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_var(--neon-cyan)]" />
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Bottom Row: Analytics & Achievements */}
            <div className="grid md:grid-cols-2 gap-6">
              <Panel accent="purple" className="p-6">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon mb-6">Course Analytics</h3>
                <div className="flex justify-around items-center">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-2" />
                      <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={36 * 2 * Math.PI} strokeDashoffset={36 * 2 * Math.PI * (1 - 0.87)} className="text-neon-purple drop-shadow-[0_0_8px_var(--neon-purple)] transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="font-display font-bold text-lg text-foreground">87%</span>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-2" />
                      <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={36 * 2 * Math.PI} strokeDashoffset={36 * 2 * Math.PI * (1 - 0.74)} className="text-neon-cyan drop-shadow-[0_0_8px_var(--neon-cyan)] transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="font-display font-bold text-lg text-foreground">74%</span>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel accent="lime" className="p-6">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon-lime mb-6">Level Up Achievements</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { title: "Shadow Monarch", icon: "👑" },
                    { title: "Dungeon Raider", icon: "⚔️" },
                    { title: "Swift Blade", icon: "🗡️" }
                  ].map((achieve, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl border border-neon-lime/20 bg-neon-lime/5 gap-2 text-center hover:border-neon-lime/50 hover:bg-neon-lime/10 transition-colors">
                      <div className="text-2xl">{achieve.icon}</div>
                      <span className="text-[9px] font-display uppercase tracking-wider text-muted-foreground leading-tight">{achieve.title}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-6">

            {/* AI Assistant */}
            <Panel accent="cyan" className="p-5 flex flex-col h-[280px]">
              <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon-cyan mb-4">AI Teacher Assistant</h3>

              <div className="flex-1 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/50 flex flex-shrink-0 items-center justify-center text-neon-cyan">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neon-cyan mb-1">ALEX</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ready to level up your dungeon strategy, Jin-Woo? You're 1 EXP from Level 101.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask the system anything..."
                  className="flex-1 h-10 bg-surface rounded-lg border border-border px-3 text-sm outline-none focus:border-neon-cyan/50 text-foreground"
                />
                <Button variant="neon" size="sm" className="h-10 px-4">
                  SEND
                </Button>
              </div>
            </Panel>

            {/* Enrolled Courses */}
            <Panel accent="purple" className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon">Enrolled Courses</h3>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {mockCourses.map((course, index) => {
                  const isCompleted = index === 0;
                  const isLocked = index === mockCourses.length - 1;
                  const progress = isCompleted ? 100 : (isLocked ? 0 : 65 - (index * 15));

                  return (
                    <div key={course.id} className={`flex flex-col gap-2 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{course.title}</h4>
                          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mt-1">Level {(index + 1) * 100}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider shrink-0 ml-2 ${isCompleted ? 'text-neon-lime border-neon-lime/30 bg-neon-lime/10' :
                          isLocked ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                            'text-neon-amber border-neon-amber/30 bg-neon-amber/10'
                          }`}>
                          {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'In Progress'}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${isCompleted ? 'bg-neon-lime shadow-[0_0_5px_var(--neon-lime)]' : 'bg-neon-cyan shadow-[0_0_5px_var(--neon-cyan)]'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {mockCourses.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No courses available in the system yet.
                  </div>
                )}
              </div>
            </Panel>

          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
