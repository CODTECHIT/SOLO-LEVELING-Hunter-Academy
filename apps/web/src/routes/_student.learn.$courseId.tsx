import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getCourseFn,
  enrollUserFn,
  markLessonCompletedFn,
  updateLessonProgressFn,
} from "@/server/courses";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Lock, Play, PlayCircle, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCloudFrontUrl } from "@/lib/cdn";

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
            onProgress(event.target.getCurrentTime() || 0, event.target.getDuration() || 0);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState?.PLAYING) {
              playerRef.current = event.target;
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    const interval = window.setInterval(() => {
      const p = playerRef.current;
      if (p) {
        const t = p.getCurrentTime() || 0;
        const d = p.getDuration() || 0;
        onProgress(t, d);
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

  const watchSecondsRef = useRef(0);
  const lastReportRef = useRef(0);
  const reportingRef = useRef(false);

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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {course.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{course.description}</p>
      </div>

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
                  <h3 className="font-display text-lg text-foreground">{currentLesson.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{currentLesson.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 flex justify-end">
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
                      <p
                        className={`truncate font-display text-sm ${isActive ? "text-neon-cyan" : "text-foreground"}`}
                      >
                        {idx + 1}. {lesson.title}
                      </p>
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
          </Panel>
        </div>
      </div>
    </div>
  );
}
