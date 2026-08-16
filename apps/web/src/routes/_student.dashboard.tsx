import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Lock, PlayCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelTitle, StatusTag } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/api";
import { getUserProfile, getUserEnrollments, getHunterStats, type EnrolledCourse } from "@/lib/api-users";

export const Route = createFileRoute("/_student/dashboard")({
  beforeLoad: async () => {
    const token = getAuthToken();
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const token = getAuthToken();

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    enabled: !!token,
  });

  // Fetch enrolled courses
  const { data: enrolledCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: getUserEnrollments,
    enabled: !!token,
  });

  // Fetch hunter stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["hunterStats"],
    queryFn: getHunterStats,
    enabled: !!token,
  });

  const isLoading = profileLoading || coursesLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neon-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !stats) {
    return (
      <div className="animate-in fade-in duration-500 space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          <Lock className="w-8 h-8 mb-4 opacity-20 mx-auto" />
          <p>Unable to load dashboard</p>
          <Link to="/login">
            <Button variant="neonPurple" className="mt-6">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate completed courses from enrolled courses
  const completedCourses = enrolledCourses.filter((c) => {
    const enrollment = c as unknown as EnrolledCourse & {
      course: { _count: { lessons: number } };
    };
    return enrollment.course._count.lessons > 0;
  }).length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Welcome back, {userProfile.name}</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Panel accent="cyan" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">
            Current Rank
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-display font-bold text-neon-cyan glow-text">
              {stats.rankLetter}
            </span>
            <span className="text-sm text-muted-foreground border border-border px-2 py-0.5 rounded-full">
              {stats.rankName}
            </span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {stats.coursesTaken} course{stats.coursesTaken === 1 ? "" : "s"} taken ·{" "}
            {stats.coursesCompleted} completed
          </div>
        </Panel>

        <Panel accent="slate" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">
            Courses Completed
          </div>
          <div className="text-4xl font-display font-bold text-foreground">{completedCourses}</div>
        </Panel>

        <Panel accent="purple" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">EXP</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-neon-purple glow-text">
              {stats.expCurrent.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {stats.expMax.toLocaleString()}
            </span>
          </div>
          <div className="mt-4">
            <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden border border-neon-purple/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-neon-purple/70 via-neon-purple to-white rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, Math.round((stats.expCurrent / stats.expMax) * 100))}%`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-lime" />
                Focus {stats.focusPct}%
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-purple" />
                Streak {stats.mpPercent}%
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle right={<Lock className="size-3.5 text-muted-foreground" />}>
          My Courses
        </PanelTitle>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {enrolledCourses.map((c) => {
            const course = c.course;
            const total = course._count.lessons || 0;
            const expiresAt = c.expiresAt ? new Date(c.expiresAt) : null;
            const expired = expiresAt && expiresAt.getTime() <= Date.now();
            const status = expired ? "Expired" : "Active";
            return (
              <div
                key={c.id}
                className="hover-glow flex flex-col rounded-2xl border border-border/70 bg-background/40 overflow-hidden"
              >
                <div className="aspect-video bg-surface-2 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neon-cyan/20">
                      <PlayCircle className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-md bg-neon-cyan/15 px-2 py-1 text-[10px] font-display font-bold uppercase tracking-widest text-neon-cyan ring-1 ring-inset ring-neon-cyan/30">
                    Course
                  </span>
                  <div className="absolute bottom-2 left-3">
                    <StatusTag status={status} />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-display font-bold text-foreground line-clamp-1">{course.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {total} lessons
                  </p>
                  <div className="mt-auto pt-2 border-t border-border/50">
                    <Link to="/learn/$courseId" params={{ courseId: course.slug }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between group hover:text-neon-cyan hover:bg-neon-cyan/10"
                      >
                        Continue Learning
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
            <p>You have not enrolled in any courses yet.</p>
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
