import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Lock, PlayCircle } from "lucide-react";
import {
  Panel,
  PanelTitle,
  RankBadge,
  StatusTag,
} from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCurrentUserFn } from "@/server/auth";
import { getEnrolledCoursesFn } from "@/server/courses";

export const Route = createFileRoute('/_student/dashboard')({
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
    meta: [
      { title: "Hunter Dashboard — Cyber Tech Academy" },
    ],
  }),
  component: Dashboard,
})

function Dashboard() {
  const { user, enrolledCourses } = Route.useLoaderData();

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Welcome back, {user.name}</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Panel accent="cyan" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Current Rank</div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-display font-bold text-neon-cyan">E</span>
            <span className="text-sm text-muted-foreground border border-border px-2 py-0.5 rounded-full">Novice</span>
          </div>
        </Panel>

        <Panel accent="purple" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Total XP</div>
          <div className="text-4xl font-display font-bold text-neon-purple">
            150 <span className="text-lg text-muted-foreground font-sans font-normal">/ 1000</span>
          </div>
          <div className="h-1.5 bg-background mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-neon-purple w-[15%]" />
          </div>
        </Panel>

        <Panel accent="slate" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Courses Completed</div>
          <div className="text-4xl font-display font-bold text-foreground">
            0
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle right={<Lock className="size-3.5 text-muted-foreground" />}>
          My Courses
        </PanelTitle>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {enrolledCourses.map((c) => (
            <div
              key={c.id}
              className="hover-glow flex flex-col rounded-xl border border-border/70 bg-background/40 overflow-hidden"
            >
              <div className="aspect-[3/1] bg-surface-2 relative">
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neon-cyan/20">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <StatusTag status="In Progress" />
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="font-display font-bold text-foreground mb-4 line-clamp-1">{c.title}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>10%</span>
                  </div>
                  <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan w-[10%]" />
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-border/50">
                  <Link to="/learn/$courseId" params={{ courseId: c.slug }}>
                    <Button variant="ghost" size="sm" className="w-full justify-between group hover:text-neon-cyan hover:bg-neon-cyan/10">
                      Continue Learning
                      <PlayCircle className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
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
