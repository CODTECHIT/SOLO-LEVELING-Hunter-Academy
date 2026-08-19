import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  getCourseFn,
  enrollUserFn,
  markLessonCompletedFn,
  updateLessonProgressFn,
} from "@/server/courses";
import { issueOrGetCertificateFn } from "@/server/certificate";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { CertificateModal } from "@/components/certificate/CertificateModal";
import {
  Lock,
  Play,
  PlayCircle,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Award,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCloudFrontUrl } from "@/lib/cdn";
import { toast } from "sonner";

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: Record<string, (event: { target: YTPlayer; data?: number }) => void>;
        },
      ) => YTPlayer;
      PlayerState?: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  return null;
}

// Wraps the official YouTube IFrame API so watch time and duration can be
// reported back for progress tracking.
function YouTubePlayer({
  videoUrl,
  onProgress,
}: {
  videoUrl: string;
  onProgress: (seconds: number, duration: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    const videoId = getYouTubeVideoId(videoUrl);
    const container = containerRef.current;
    if (!videoId || !container) return;

    let player: YTPlayer | null = null;

    const createPlayer = () => {
      if (!containerRef.current || !window.YT?.Player) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, autoplay: 1 },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState?.PLAYING) {
              const dur = player?.getDuration() || 0;
              const cur = player?.getCurrentTime() || 0;
              onProgress(cur, dur);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    const interval = window.setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        if (dur > 0) onProgress(cur, dur);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
      try {
        // React detaches the iframe before passive-effect cleanups run, and the
        // YT player throws when destroy() touches the already-detached iframe.
        player?.destroy();
      } catch {
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export const Route = createFileRoute("/_student/learn/$courseId")({
  loader: async ({ params }) => {
    return await getCourseFn({ data: { slug: params.courseId } });
  },
  component: LearnCourse,
});

function LearnCourse() {
  const {
    course,
    isEnrolled,
    hasAccessExpired,
    completedLessonIds: initialCompleted,
    lessonProgress: initialProgress,
  } = Route.useLoaderData();
  const router = useRouter();

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(course.lessons?.[0] || null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompleted || []);
  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>(
    initialProgress || {},
  );

  // Certificate State
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [isClaimingCert, setIsClaimingCert] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const watchSecondsRef = useRef(0);
  const lastReportRef = useRef(0);
  const reportingRef = useRef(false);

  const isFullyCompleted =
    course.lessons &&
    course.lessons.length > 0 &&
    course.lessons.every((l: any) => completedLessonIds.includes(l.id));

  // Reset per-lesson watch tracking when the student switches lessons.
  useEffect(() => {
    watchSecondsRef.current = 0;
    lastReportRef.current = 0;
  }, [currentLesson?.id]);

  const reportProgress = useCallback(
    async (lessonId: string, watched: number, duration: number) => {
      if (!isEnrolled || reportingRef.current) return;
      reportingRef.current = true;
      try {
        const res = await updateLessonProgressFn({
          data: { lessonId, watchedSeconds: Math.round(watched), duration: Math.round(duration) },
        });
        if (res.completed) {
          setCompletedLessonIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
        }
        setLessonProgress((prev) =>
          res.progressSeconds > (prev[lessonId] || 0)
            ? { ...prev, [lessonId]: res.progressSeconds }
            : prev,
        );
      } catch (err) {
        console.error(err);
      } finally {
        reportingRef.current = false;
      }
    },
    [isEnrolled],
  );

  const handleProgress = useCallback(
    (watched: number, duration: number) => {
      if (!currentLesson || !isEnrolled) return;
      watchSecondsRef.current = Math.max(watchSecondsRef.current, watched);
      const threshold = duration > 0 ? Math.ceil(duration * 0.9) : Infinity;
      const now = Date.now();
      // Throttle to ~once per 4s, but always send immediately when the
      // 90% watch threshold is crossed so completion is not delayed.
      if (now - lastReportRef.current >= 4000 || watchSecondsRef.current >= threshold) {
        lastReportRef.current = now;
        reportProgress(currentLesson.id, watchSecondsRef.current, duration);
      }
      // Mirror watched seconds locally so the syllabus bar fills as you watch.
      setLessonProgress((prev) => {
        const current = prev[currentLesson.id] || 0;
        const next = Math.max(current, Math.round(watchSecondsRef.current));
        return next === current ? prev : { ...prev, [currentLesson.id]: next };
      });
    },
    [currentLesson, isEnrolled, reportProgress],
  );

  const handleEnroll = async () => {
    try {
      setIsEnrolling(true);
      await enrollUserFn({ data: { courseId: course.id } });
      router.invalidate(); // refresh loader to see enrolled state
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    try {
      setIsCompleting(true);
      await markLessonCompletedFn({ data: { lessonId: currentLesson.id } });
      if (!completedLessonIds.includes(currentLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, currentLesson.id]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClaimCertificate = async () => {
    setIsClaimingCert(true);
    try {
      const res = await issueOrGetCertificateFn({ data: { courseId: course.id } });
      setCertificateData(res);
      setShowCertModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setIsClaimingCert(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {course.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{course.description}</p>
      </div>

      {/* 100% Course Completion Certificate Banner */}
      {isFullyCompleted && (
        <div className="mb-6 p-5 rounded-2xl border-2 border-neon-purple/60 bg-gradient-to-r from-neon-purple/20 via-surface to-neon-cyan/20 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-in slide-in-from-top-3">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-purple/30 border border-neon-purple text-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.5)] shrink-0">
              <Award className="h-8 w-8 text-neon-purple" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-neon-lime/20 text-neon-lime border border-neon-lime/40">
                  100% Mastery Complete
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {course.lessons.length} Lessons Finished
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground mt-1">
                Official Course Completion Certificate Unlocked!
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Congratulations! You have completed all syllabus feeds and modules.
              </p>
            </div>
          </div>
          <Button
            variant="hero"
            onClick={handleClaimCertificate}
            disabled={isClaimingCert}
            className="cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.5)] font-bold text-sm px-5 py-2.5"
          >
            {isClaimingCert ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Issuing...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4 text-neon-cyan" /> Claim & Download Certificate
              </>
            )}
          </Button>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertModal && certificateData && (
        <CertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          certificate={certificateData.certificate}
          template={certificateData.template}
          studentName={certificateData.user?.name}
          courseTitle={course.title}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* Left Pane: Video Player */}
        <div className="space-y-6">
          <Panel accent="cyan" className="overflow-hidden p-0 flex flex-col">
            {isEnrolled && currentLesson ? (
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                {currentLesson.videoUrl && getYouTubeVideoId(currentLesson.videoUrl) ? (
                  <YouTubePlayer videoUrl={currentLesson.videoUrl} onProgress={handleProgress} />
                ) : currentLesson.videoUrl ? (
                  <video
                    key={currentLesson.id}
                    src={getCloudFrontUrl(currentLesson.videoUrl.trim())}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                    poster={course.thumbnail ? getCloudFrontUrl(course.thumbnail) : undefined}
                    onTimeUpdate={(e) =>
                      handleProgress(e.currentTarget.currentTime, e.currentTarget.duration)
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <Play className="mb-2 h-10 w-10 opacity-50" />
                    <p className="text-sm font-medium">No video uploaded for this lesson yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-background/70 p-8 text-center">
                <div className="grid-runes absolute inset-0 opacity-40" />
                <Lock className="relative z-10 mb-4 h-12 w-12 text-neon-amber" />
                <h3 className="relative z-10 font-display text-xl text-foreground">
                  {hasAccessExpired ? "Access Expired" : "Access Restricted"}
                </h3>
                <p className="relative z-10 mt-2 max-w-md text-sm text-muted-foreground">
                  {hasAccessExpired
                    ? "Your 1-year access to this course has ended. Renew it to continue where you left off."
                    : "You must be enrolled in this course to view the restricted dungeon feeds."}
                </p>
                {!isEnrolled && (
                  <Button
                    variant="hero"
                    className="relative z-10 mt-6"
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                  >
                    {isEnrolling
                      ? "Unlocking..."
                      : hasAccessExpired
                        ? "Renew Access (1 Year)"
                        : "Unlock Course (Mock Free)"}
                  </Button>
                )}
              </div>
            )}

            {currentLesson && isEnrolled && (
              <div className="border-t border-border px-5 py-4 flex flex-col">
                <div>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="font-display text-lg text-foreground">{currentLesson.title}</h3>
                    {(currentLesson as any)?.quiz && (
                      <Link to="/quiz/$quizId" params={{ quizId: (currentLesson as any).quiz.id }}>
                        <Button variant="neonPurple" size="sm" className="gap-2 text-xs">
                          <FileQuestion className="h-4 w-4" />
                          Take Lesson Quiz
                        </Button>
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{currentLesson.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                  {(currentLesson as any)?.quiz ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-neon-purple" />
                      Trial Assessment: {(currentLesson as any).quiz.title} ({(currentLesson as any).quiz.timeLimit ? `${(currentLesson as any).quiz.timeLimit} mins` : "No limit"})
                    </span>
                  ) : <div />}

                  <Button
                    variant={completedLessonIds.includes(currentLesson.id) ? "ghost" : "neon"}
                    onClick={handleMarkComplete}
                    disabled={isCompleting || completedLessonIds.includes(currentLesson.id)}
                    className={
                      completedLessonIds.includes(currentLesson.id)
                        ? "text-neon-lime border-neon-lime/30"
                        : ""
                    }
                  >
                    {completedLessonIds.includes(currentLesson.id) ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
                      </>
                    ) : (
                      "Mark as Complete"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Right Pane: Playlist */}
        <div className="space-y-6">
          <Panel>
            <PanelTitle>Course Syllabus</PanelTitle>
            <div className="space-y-3">
              {course.lessons?.map((lesson, idx) => {
                const isActive = currentLesson?.id === lesson.id;
                const isCompleted = completedLessonIds.includes(lesson.id);
                const watched = lessonProgress[lesson.id] || 0;
                const lessonDuration = lesson.duration || 0;
                const hasQuiz = Boolean((lesson as any)?.quiz);
                const pct = isCompleted
                  ? 100
                  : lessonDuration > 0
                    ? Math.min(Math.round((watched / lessonDuration) * 100), 100)
                    : 0;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => isEnrolled && setCurrentLesson(lesson)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      isActive
                        ? "border-neon-cyan/50 bg-neon-cyan/10"
                        : "border-border/60 hover:bg-background/50"
                    } ${!isEnrolled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {isEnrolled ? (
                      isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-neon-lime" />
                      ) : (
                        <PlayCircle
                          className={`h-5 w-5 shrink-0 ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`}
                        />
                      )
                    ) : (
                      <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`truncate font-display text-sm ${isActive ? "text-neon-cyan" : "text-foreground"}`}
                        >
                          {idx + 1}. {lesson.title}
                        </p>
                        {hasQuiz && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded bg-neon-purple/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neon-purple">
                            <FileQuestion className="h-2.5 w-2.5" /> Quiz
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? "bg-neon-lime" : "bg-neon-cyan"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {lesson.duration ? (
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {Math.floor(lesson.duration / 60)} mins
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-muted-foreground">{pct}%</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {(!course.lessons || course.lessons.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No feeds available yet.
                </p>
              )}
            </div>

            {/* Course-level Quizzes (Final Assessments) */}
            {Boolean((course as any)?.quizzes?.length) && isEnrolled && (
              <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                <div className="text-xs font-display font-bold uppercase tracking-wider text-neon-purple flex items-center gap-1.5 mb-2">
                  <Award className="h-3.5 w-3.5" /> Course Assessments
                </div>
                {(course as any).quizzes.map((q: any) => (
                  <Link
                    key={q.id}
                    to="/quiz/$quizId"
                    params={{ quizId: q.id }}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-neon-purple/30 bg-neon-purple/10 hover:bg-neon-purple/20 transition-all text-left group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-neon-purple transition-colors truncate">
                        {q.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {q.timeLimit ? `${q.timeLimit} mins` : "Untimed"} · Pass: {q.passingScore}%
                      </p>
                    </div>
                    <Button variant="neonPurple" size="sm" className="shrink-0 text-xs h-7 px-3">
                      Start
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
