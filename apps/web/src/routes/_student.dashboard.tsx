import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Lock, PlayCircle, Award, CheckCircle2 } from "lucide-react";
import { Panel, PanelTitle, StatusTag } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCurrentUserFn } from "@/server/auth";
import { getHunterStatsFn, getEnrolledCoursesFn } from "@/server/courses";
import { issueOrGetCertificateFn } from "@/server/certificate";
import { CertificateModal } from "@/components/certificate/CertificateModal";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_student/dashboard")({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    const [stats, enrolledCourses] = await Promise.all([
      getHunterStatsFn(),
      getEnrolledCoursesFn(),
    ]);
    return { user, stats, enrolledCourses };
  },
  head: () => ({
    meta: [
      { title: "Hunter Dashboard — Cyber Tech Academy" },
      { name: "description", content: "View your stats, rank, and active courses." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user: userProfile, stats, enrolledCourses } = Route.useLoaderData();
  const [activeCertData, setActiveCertData] = useState<any | null>(null);
  const [isOpeningCert, setIsOpeningCert] = useState(false);

  const completedCourses =
    stats.coursesCompleted ?? enrolledCourses.filter((c) => c.progress === 100).length;

  const handleOpenCertificate = async (courseId: string) => {
    setIsOpeningCert(true);
    try {
      const res = await issueOrGetCertificateFn({ data: { courseId } });
      setActiveCertData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load certificate");
    } finally {
      setIsOpeningCert(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Welcome back, {userProfile.name}
      </h1>

      {/* Certificate Modal */}
      {activeCertData && (
        <CertificateModal
          isOpen={Boolean(activeCertData)}
          onClose={() => setActiveCertData(null)}
          certificate={activeCertData.certificate}
          template={activeCertData.template}
          studentName={activeCertData.user?.name}
          courseTitle={activeCertData.certificate?.course?.title}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rank Card */}
        <Link to="/ranks" className="block group">
          <Panel accent="cyan" className="flex flex-col justify-center h-full transition-all group-hover:border-neon-cyan/80">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Current Rank</span>
              <span className="text-xs text-neon-cyan group-hover:underline">Guide ➔</span>
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
              {stats.coursesTaken} course{stats.coursesTaken === 1 ? "" : "s"} enrolled • Learn how to rank up
            </div>
          </Panel>
        </Link>

        {/* Daily Study Streak Card */}
        <Panel accent="purple" className="flex flex-col justify-center relative overflow-hidden">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider flex items-center justify-between">
            <span>Study Streak</span>
            <span className="text-lg">🔥</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-neon-purple glow-text">
              {stats.streak}
            </span>
            <span className="text-sm text-foreground font-semibold">
              Day{stats.streak === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Record: {stats.longestStreak || stats.streak} Days</span>
            <span className="text-neon-purple font-mono font-bold">{stats.mpPercent}% MP</span>
          </div>
        </Panel>

        {/* Courses Completed */}
        <Panel accent="slate" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">
            Courses Completed
          </div>
          <div className="text-4xl font-display font-bold text-foreground">{completedCourses}</div>
          <div className="mt-3 text-xs text-muted-foreground">
            {stats.lessonsCompleted} lessons mastered
          </div>
        </Panel>

        {/* EXP & Focus */}
        <Panel accent="purple" className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">EXP Progress</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-neon-purple glow-text">
              {stats.expCurrent.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              / {stats.expMax.toLocaleString()}
            </span>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-neon-purple/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-neon-purple/70 via-neon-purple to-white rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, Math.round((stats.expCurrent / stats.expMax) * 100))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-lime" />
                Focus {stats.focusPct}%
              </span>
              <span className="text-neon-cyan font-mono">
                {Math.min(100, Math.round((stats.expCurrent / stats.expMax) * 100))}%
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
            const total = c.totalLessons ?? 0;
            const status = c.expired ? "Expired" : "Active";
            const isCompleted = (c.progress ?? 0) === 100;

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
                    Course
                  </span>
                  <div className="absolute bottom-2 left-3">
                    <StatusTag status={status} />
                  </div>
                  {isCompleted && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-neon-purple/20 px-2 py-1 text-[10px] font-bold text-neon-purple border border-neon-purple/40">
                      <Award className="h-3 w-3" /> Certified
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-display font-bold text-foreground line-clamp-1">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {total} lesson{total === 1 ? "" : "s"} · {c.progress ?? 0}% completed
                  </p>
                  <div className="mt-auto pt-2 border-t border-border/50 flex items-center gap-2">
                    <Link to="/learn/$courseId" params={{ courseId: c.slug }} className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between group hover:text-neon-cyan hover:bg-neon-cyan/10"
                      >
                        {isCompleted ? "Review Course" : "Continue Learning"}
                        <PlayCircle className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      </Button>
                    </Link>
                    {isCompleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCertificate(c.id)}
                        disabled={isOpeningCert}
                        className="text-xs border-neon-purple/50 text-neon-purple hover:bg-neon-purple/20 shrink-0"
                        title="View Certificate"
                      >
                        <Award className="h-3.5 w-3.5 mr-1" /> Certificate
                      </Button>
                    )}
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
