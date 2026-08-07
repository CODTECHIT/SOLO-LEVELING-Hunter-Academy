import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  getAdminCourseDetailsFn,
  createLessonFn,
  updateLessonFn,
  deleteLessonFn,
} from "@/server/admin";
import {
  getPresignedUrlFn,
  uploadFileToS3Fn,
  getCourseFaqsFn,
  saveFaqItemFn,
  deleteFaqItemFn,
} from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Plus, Trash2, Pencil, Upload, Loader2, HelpCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/courses_/$courseId")({
  loader: async ({ params }) => {
    const course = await getAdminCourseDetailsFn({ data: { courseId: params.courseId } });
    const { faqs } = await getCourseFaqsFn({ data: { courseId: params.courseId } });
    return { course, faqs };
  },
  component: CourseLessonsAdmin,
});

const emptyLesson = { title: "", description: "", videoUrl: "" };
const emptyFaq = { question: "", answer: "" };

function CourseLessonsAdmin() {
  const { course, faqs } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyLesson);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [isCreatingFaq, setIsCreatingFaq] = useState(false);
  const [faqEditingId, setFaqEditingId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState(emptyFaq);

  const startCreateFaq = () => {
    setFaqEditingId(null);
    setFaqForm(emptyFaq);
    setIsCreatingFaq(true);
  };

  const startEditFaq = (f: (typeof faqs)[number]) => {
    setFaqEditingId(f.id);
    setFaqForm({ question: f.question, answer: f.answer });
    setIsCreatingFaq(true);
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveFaqItemFn({
        data: {
          id: faqEditingId ?? undefined,
          question: faqForm.question,
          answer: faqForm.answer,
          courseId: course.id,
        },
      });
      setIsCreatingFaq(false);
      setFaqEditingId(null);
      setFaqForm(emptyFaq);
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save FAQ";
      alert(
        /(Invalid `prisma\.|Unknown argument)/.test(message)
          ? "Failed to save FAQ. Please try again."
          : message,
      );
    }
  };

  const handleFaqDelete = async (id: string) => {
    if (!confirm("Delete this FAQ entry?")) return;
    try {
      await deleteFaqItemFn({ data: { id } });
      router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete FAQ");
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setFormData(emptyLesson);
    setIsCreating(true);
  };

  const startEdit = (lesson: (typeof course.lessons)[number]) => {
    setEditingId(lesson.id);
    setFormData({
      title: lesson.title,
      description: lesson.description ?? "",
      videoUrl: lesson.videoUrl,
    });
    setIsCreating(true);
  };

  const handleVideoUpload = async (file: File) => {
    const contentType = file.type || "video/mp4";
    setIsUploadingVideo(true);

    try {
      // 1. Try Direct S3 Presigned URL upload (Zero server bandwidth)
      const { uploadUrl, publicUrl } = await getPresignedUrlFn({
        data: { filename: file.name, contentType, folder: "lesson-videos" },
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!res.ok) throw new Error(`Direct upload status ${res.status}`);

      setFormData((prev) => ({ ...prev, videoUrl: publicUrl }));
    } catch (directErr: unknown) {
      console.warn(
        "Direct S3 upload failed/blocked by CORS. Falling back to server-side S3 upload...",
        directErr,
      );

      try {
        // 2. Automatic Fallback: Server-side S3 upload (Bypasses CORS completely)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;

        const { publicUrl } = await uploadFileToS3Fn({
          data: {
            filename: file.name,
            base64Data,
            contentType,
            folder: "lesson-videos",
          },
        });

        setFormData((prev) => ({ ...prev, videoUrl: publicUrl }));
      } catch (fallbackErr: unknown) {
        alert(
          `S3 Upload failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
        );
      }
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateLessonFn({ data: { lessonId: editingId, ...formData } });
      } else {
        await createLessonFn({ data: { courseId: course.id, ...formData } });
      }
      setIsCreating(false);
      setEditingId(null);
      setFormData(emptyLesson);
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save lesson";
      alert(
        /(Invalid `prisma\.|Unknown argument)/.test(message)
          ? "Failed to save lesson. Please try again."
          : message,
      );
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await deleteLessonFn({ data: { lessonId } });
      router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete lesson");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to="/admin/academy/courses">
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
        <Button variant="hero" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Lesson
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>{editingId ? "Edit Lesson" : "Create New Lesson"}</PanelTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-xl">
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
                Video (Upload to S3 or paste URL)
              </label>
              <div className="flex gap-2">
                <input
                  required
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://... or upload a video file ->"
                  className="flex-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
                <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors shrink-0">
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Upload S3 Video
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingVideo}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setFormData(emptyLesson);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                {editingId ? "Save Changes" : "Save Lesson"}
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
                onClick={() => startEdit(lesson)}
                className="text-neon-lime hover:text-neon-lime hover:bg-neon-lime/10"
                title="Edit lesson"
              >
                <Pencil className="h-4 w-4" />
              </Button>
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

      <div className="flex items-center justify-between pt-4">
        <h2 className="font-display text-lg uppercase tracking-widest text-muted-foreground">
          Course FAQs
        </h2>
        <Button variant="hero" onClick={startCreateFaq}>
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {isCreatingFaq && (
        <Panel accent="lime" className="mb-6">
          <PanelTitle>{faqEditingId ? "Edit Question" : "New Question"}</PanelTitle>
          <form onSubmit={handleFaqSubmit} className="mt-4 space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Question
              </label>
              <input
                required
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-lime focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Answer
              </label>
              <textarea
                required
                rows={4}
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-lime focus:outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreatingFaq(false);
                  setFaqEditingId(null);
                  setFaqForm(emptyFaq);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                {faqEditingId ? "Save Changes" : "Add Entry"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <div className="space-y-3">
        {faqs.map((f) => (
          <Panel
            key={f.id}
            className="p-4 flex items-center justify-between hover:border-neon-lime/50 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-neon-lime/20 text-neon-lime">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-foreground">
                  {f.question}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground max-w-2xl">
                  {f.answer}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEditFaq(f)}
                className="text-neon-lime hover:text-neon-lime hover:bg-neon-lime/10"
                title="Edit FAQ"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFaqDelete(f.id)}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Panel>
        ))}
        {faqs.length === 0 && !isCreatingFaq && (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No FAQs for this course yet. Click "Add FAQ" to create one. If none are set, the course
            page shows the global FAQ list.
          </div>
        )}
      </div>
    </div>
  );
}
