import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getCourseFn, enrollUserFn, markLessonCompletedFn } from '@/server/courses'
import { Panel, PanelTitle } from '@/components/site/ui-bits'
import { Button } from '@/components/ui/button'
import { Lock, Play, PlayCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

function getYouTubeEmbedUrl(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return null;
}

export const Route = createFileRoute('/_student/learn/$courseId')({
  loader: async ({ params }) => {
    return await getCourseFn({ data: { slug: params.courseId } })
  },
  component: LearnCourse,
})

function LearnCourse() {
  const { course, isEnrolled, completedLessonIds: initialCompleted } = Route.useLoaderData()
  const router = useRouter()
  
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(course.lessons?.[0] || null)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompleted || [])

  const handleEnroll = async () => {
    try {
      setIsEnrolling(true)
      await enrollUserFn({ data: { courseId: course.id } })
      router.invalidate() // refresh loader to see enrolled state
    } catch (err) {
      console.error(err)
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!currentLesson) return
    try {
      setIsCompleting(true)
      await markLessonCompletedFn({ data: { lessonId: currentLesson.id } })
      if (!completedLessonIds.includes(currentLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, currentLesson.id])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {course.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{course.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        
        {/* Left Pane: Video Player */}
        <div className="space-y-6">
          <Panel accent="cyan" className="overflow-hidden p-0 flex flex-col h-full">
            {isEnrolled && currentLesson ? (
              <div className="relative aspect-video w-full bg-black">
                {getYouTubeEmbedUrl(currentLesson.videoUrl) ? (
                  <iframe 
                    src={getYouTubeEmbedUrl(currentLesson.videoUrl)!}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                ) : (
                  <video 
                    src={currentLesson.videoUrl} 
                    controls 
                    className="h-full w-full object-contain"
                    poster={course.thumbnail || undefined}
                  />
                )}
              </div>
            ) : (
              <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-background/70 p-8 text-center">
                <div className="grid-runes absolute inset-0 opacity-40" />
                <Lock className="relative z-10 mb-4 h-12 w-12 text-neon-amber" />
                <h3 className="relative z-10 font-display text-xl text-foreground">
                  Access Restricted
                </h3>
                <p className="relative z-10 mt-2 max-w-md text-sm text-muted-foreground">
                  You must be enrolled in this course to view the restricted dungeon feeds.
                </p>
                {!isEnrolled && (
                  <Button 
                    variant="hero" 
                    className="relative z-10 mt-6"
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? "Unlocking..." : "Unlock Course (Mock Free)"}
                  </Button>
                )}
              </div>
            )}
            
            {currentLesson && isEnrolled && (
              <div className="border-t border-border px-5 py-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-display text-lg text-foreground">{currentLesson.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{currentLesson.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 flex justify-end">
                  <Button 
                    variant={completedLessonIds.includes(currentLesson.id) ? "ghost" : "neon"} 
                    onClick={handleMarkComplete}
                    disabled={isCompleting || completedLessonIds.includes(currentLesson.id)}
                    className={completedLessonIds.includes(currentLesson.id) ? "text-neon-lime border-neon-lime/30" : ""}
                  >
                    {completedLessonIds.includes(currentLesson.id) ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Completed</>
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
                const isActive = currentLesson?.id === lesson.id
                const isCompleted = completedLessonIds.includes(lesson.id)
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
                        <PlayCircle className={`h-5 w-5 shrink-0 ${isActive ? "text-neon-cyan" : "text-muted-foreground"}`} />
                      )
                    ) : (
                      <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-display text-sm ${isActive ? "text-neon-cyan" : "text-foreground"}`}>
                        {idx + 1}. {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(lesson.duration / 60)} mins
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
              {(!course.lessons || course.lessons.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No feeds available yet.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
