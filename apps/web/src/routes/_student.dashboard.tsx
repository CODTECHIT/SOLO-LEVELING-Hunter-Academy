import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Lock, PlayCircle } from "lucide-react";
import { Panel, PanelTitle, RankBadge, StatusTag } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCurrentUserFn } from "@/server/auth";
import { getEnrolledCoursesFn } from "@/server/courses";
import { HunterStatsBar } from "@/components/site/HunterStatsBar";

export const Route = createFileRoute("/_student/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  loader: async ({ context }) => {
    const enrolledCourses = await getEnrolledCoursesFn();
    return { user: context.user, enrolledCourses };
  },
  head: () => ({
    meta: [{ title: "Hunter Dashboard — Cyber Tech Academy" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, enrolledCourses } = Route.useLoaderData();
  const completedCourses = enrolledCourses.filter(
    (c) => c.totalLessons > 0 && c.completedLessons >= c.totalLessons,
  ).length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Welcome back, {user.name}</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-center">
        <Panel accent="cyan" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">
            Current Rank
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-display font-bold text-neon-cyan glow-text">E</span>
            <span className="text-sm text-muted-foreground border border-border px-2 py-0.5 rounded-full">
              Novice Hunter
            </span>
          </div>
        </Panel>

        <Panel accent="slate" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">
            Courses Completed
          </div>
          <div className="text-4xl font-display font-bold text-foreground">{completedCourses}</div>
        </Panel>

        <div className="sm:col-span-2 lg:col-span-1">
          <HunterStatsBar expCurrent={150} expMax={1000} hpPercent={88} mpPercent={75} />
        </div>
      </div>

      <Panel>
        <PanelTitle right={<Lock className="size-3.5 text-muted-foreground" />}>
          My Courses
        </PanelTitle>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {enrolledCourses.map((c) => {
            const total = c.totalLessons || 0;
            const completed = c.completedLessons || 0;
            const pct = c.progress || 0;
            const done = total > 0 && completed >= total;
            const status = done ? "Completed" : pct > 0 ? "In Progress" : "Not Started";
            return (
              <div
                key={c.id}
                className="hover-glow flex flex-col rounded-2xl border border-border/70 bg-background/40 overflow-hidden"
              >
                <div className="aspect-video bg-surface-2 relative overflow-hidden">
                  {c.thumbnail ? (
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neon-cyan/20">
                      <PlayCircle className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-md bg-neon-cyan/15 px-2 py-1 text-[10px] font-display font-bold uppercase tracking-widest text-neon-cyan ring-1 ring-inset ring-neon-cyan/30">
                    {c.type === "MODULE" ? "Hunter Pass" : "Full Course"}
                  </span>
                  <div className="absolute bottom-2 left-3">
                    <StatusTag status={status} />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-display font-bold text-foreground line-clamp-1">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {completed} of {total} lessons completed
                  </p>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-cyan rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-auto pt-2 border-t border-border/50">
                    <Link to="/learn/$courseId" params={{ courseId: c.slug }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between group hover:text-neon-cyan hover:bg-neon-cyan/10"
                      >
                        {done ? "Review Course" : pct > 0 ? "Continue Learning" : "Start Learning"}
                        <PlayCircle className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {enrolledCourses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Lock className="w-8 h-8 mb-4 opacity-20" />
            <p>You have not unlocked any pathways yet.</p>
            <Link to="/courses">
              <Button variant="neonPurple" className="mt-6">
                Browse Courses
              </Button>
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
}
