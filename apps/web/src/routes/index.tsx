import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav, SiteFooter } from "@/components/site/nav";
import { Button } from "@/components/ui/button";
import { PlayCircle, Lock, Send, Bot, CheckCircle2, ChevronRight, Pause, Volume2, Maximize, Crown, Swords, Shield, Zap } from "lucide-react";
import { getCatalogFn, getEnrolledCoursesFn } from "@/server/courses";
import { getCurrentUserFn } from "@/server/auth";
import { getActiveIntroVideoFn } from "@/server/cms";
import { Panel } from "@/components/site/ui-bits";
import { HunterStatsBar } from "@/components/site/HunterStatsBar";

export const Route = createFileRoute("/")({
  loader: async () => {
    const catalog = await getCatalogFn();
    const user = await getCurrentUserFn();
    let enrolledCourses: any[] = [];
    if (user) {
      enrolledCourses = await getEnrolledCoursesFn();
    }
    const { video: activeVideo } = await getActiveIntroVideoFn();
    return { ...catalog, user, enrolledCourses, activeVideo };
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
  const { fullCourses, moduleCourses, user, enrolledCourses, activeVideo } = Route.useLoaderData();
  // Mock "my enrolled" list shows the flagship full courses (consistent tier);
  // topic modules live in the Hunter Pass section.
  const mockCourses = fullCourses.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Profile Header / Slogan */}
        <Panel accent="purple" className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-2xl border border-neon-cyan bg-neon-cyan/10 flex items-center justify-center font-display text-2xl font-bold text-neon-cyan glow-text shadow-[0_0_15px_-3px_var(--neon-cyan)]">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground tracking-wider">
                Unleash Your Inner Hunter
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">
                Dominate the digital realm with elite cyber security skills
              </p>
            </div>
          </div>

          <HunterStatsBar expCurrent={74999} expMax={75000} hpPercent={92} mpPercent={68} />
        </Panel>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Main Left Column */}
          <div className="flex flex-col gap-6">

            {/* Introduction Video */}
            <Panel accent="cyan" className="flex flex-col overflow-hidden bg-background">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="font-display font-bold uppercase tracking-widest text-neon-cyan text-sm">
                  {activeVideo ? activeVideo.title : "Welcome to the Academy"}
                </h2>
                <span className="text-[10px] font-display text-muted-foreground tracking-widest uppercase">Intro</span>
              </div>
              <div className="relative aspect-video bg-[#050810] flex items-center justify-center overflow-hidden">
                <video
                  key={activeVideo?.videoUrl || "default"}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={activeVideo?.thumbnail || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1920"}
                  src={activeVideo?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </Panel>

            {/* Bottom Row: Analytics & Achievements */}
            <div className="grid md:grid-cols-2 gap-6">
              <Panel accent="purple" className="p-6">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon mb-6">Course Analytics</h3>
                <div className="flex justify-around items-center">
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-2" />
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={36 * 2 * Math.PI} strokeDashoffset={0} className="text-neon-purple drop-shadow-[0_0_8px_var(--neon-purple)] transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="font-display font-bold text-2xl text-foreground">{fullCourses.length}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mt-3">Total Courses</span>
                  </div>
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-2" />
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={36 * 2 * Math.PI} strokeDashoffset={0} className="text-neon-cyan drop-shadow-[0_0_8px_var(--neon-cyan)] transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="font-display font-bold text-2xl text-foreground">{moduleCourses.length}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mt-3">Hunter Passes</span>
                  </div>
                </div>
              </Panel>

              <Panel accent="lime" className="p-6">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon-lime mb-6">Level Up Achievements</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { title: "Shadow Monarch", icon: <Crown className="w-6 h-6 text-neon-lime" /> },
                    { title: "Dungeon Raider", icon: <Swords className="w-6 h-6 text-neon-lime" /> },
                    { title: "Swift Blade", icon: <Shield className="w-6 h-6 text-neon-lime" /> }
                  ].map((achieve, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl border border-neon-lime/20 bg-neon-lime/5 gap-2 text-center hover:border-neon-lime/50 hover:bg-neon-lime/10 transition-colors shadow-[0_0_15px_-5px_var(--neon-lime)]">
                      <div>{achieve.icon}</div>
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

            {/* Enrolled Courses / Call to Action */}
            <Panel accent="purple" className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-neon">
                  {user ? "Your Enrolled Courses" : "Start Your Journey"}
                </h3>
                {!user && <Lock className="w-4 h-4 text-muted-foreground" />}
              </div>

              <div className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {user ? (
                  enrolledCourses.length > 0 ? (
                    enrolledCourses.map((course: any, index: number) => {
                      const isCompleted = course.progress === 100;
                      return (
                        <div key={course.id} className="flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-foreground line-clamp-1">{course.title}</h4>
                              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mt-1">Level {(index + 1) * 100}</p>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider shrink-0 ml-2 ${isCompleted ? 'text-neon-lime border-neon-lime/30 bg-neon-lime/10' : 'text-neon-amber border-neon-amber/30 bg-neon-amber/10'}`}>
                              {isCompleted ? 'Completed' : 'In Progress'}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${isCompleted ? 'bg-neon-lime shadow-[0_0_5px_var(--neon-lime)]' : 'bg-neon-cyan shadow-[0_0_5px_var(--neon-cyan)]'}`}
                              style={{ width: `${course.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      You haven't enrolled in any courses yet.
                      <div className="mt-4">
                        <Link to="/courses" className="text-neon-cyan hover:underline text-xs">Browse Catalog</Link>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground mb-2">Enroll in these courses to begin your leveling process.</p>
                    {mockCourses.map((course) => (
                      <Link key={course.id} to="/courses/$slug" params={{ slug: course.slug }} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-surface/50 hover:bg-surface transition-colors group">
                        <div className="w-10 h-10 rounded bg-neon-cyan/10 flex items-center justify-center shrink-0">
                           <Zap className="w-5 h-5 text-neon-cyan group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-neon-cyan transition-colors">{course.title}</h4>
                           <p className="text-xs text-muted-foreground">₹{course.price}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-neon-cyan" />
                      </Link>
                    ))}
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
