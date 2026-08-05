import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getAdminCourseDetailsFn, createLessonFn, deleteLessonFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/courses_/$courseId")({
  loader: async ({ params }) => {
    return await getAdminCourseDetailsFn({ data: { courseId: params.courseId } });
  },
  component: CourseLessonsAdmin,
});

function CourseLessonsAdmin() {
  const course = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", videoUrl: "" });

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLessonFn({ data: { courseId: course.id, ...formData } });
    setIsCreating(false);
    setFormData({ title: "", description: "", videoUrl: "" });
    router.invalidate();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    await deleteLessonFn({ data: { lessonId } });
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Course Content</h1>
          <p className="mt-1 text-sm text-neon-cyan glow-text">{course.title}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg uppercase tracking-widest text-muted-foreground">
          Modules & Lessons
        </h2>
        <Button variant="hero" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" /> Add Lesson
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>Create New Lesson</PanelTitle>
          <form onSubmit={handleCreateLesson} className="mt-4 space-y-4 max-w-xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Lesson Title
              </label>
              <input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Video URL (YouTube/Vimeo/Direct)
              </label>
              <input
                required
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                Save Lesson
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <div className="space-y-3">
        {course.lessons.map((lesson, index) => (
          <Panel
            key={lesson.id}
            className="p-4 flex items-center justify-between hover:border-neon-cyan/50 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-neon-cyan/20 text-neon-cyan">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-foreground">
                  {lesson.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Play className="h-3 w-3 text-muted-foreground" />
                  <p className="truncate text-xs text-muted-foreground max-w-xs sm:max-w-md">
                    {lesson.videoUrl}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteLesson(lesson.id)}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Panel>
        ))}
        {course.lessons.length === 0 && !isCreating && (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No lessons in this course yet. Click "Add Lesson" to start building the curriculum.
          </div>
        )}
      </div>
    </div>
  );
}
