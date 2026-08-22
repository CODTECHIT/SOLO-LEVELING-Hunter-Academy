import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  getAdminCoursesFn,
  toggleCoursePublishedFn,
  createCourseFn,
  updateCourseFn,
  deleteCourseFn,
} from "@/server/admin";
import { getPresignedUrlFn, uploadFileToS3Fn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/courses")({
  loader: async () => {
    return await getAdminCoursesFn();
  },
  component: AdminCourses,
});

type CourseFormData = {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  type: "FULL" | "MODULE";
  thumbnail: string;
};

const emptyForm: CourseFormData = {
  title: "",
  description: "",
  price: 0,
  categoryId: "",
  type: "FULL",
  thumbnail: "",
};

function AdminCourses() {
  const { courses, categories } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(emptyForm);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");

  const startCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setUploadProgress(null);
    setUploadStatusText("");
    setIsCreating(true);
  };

  const startEdit = (course: (typeof courses)[number]) => {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      categoryId: course.categoryId,
      type: course.type,
      thumbnail: course.thumbnail ?? "",
    });
    setUploadProgress(null);
    setUploadStatusText("");
    setIsCreating(true);
  };

  const handleFileUpload = async (file: File) => {
    const contentType = file.type || "image/jpeg";
    setIsUploadingThumbnail(true);
    setUploadProgress(0);
    setUploadStatusText("Requesting S3 upload ticket...");

    try {
      // 1. Try Direct S3 Presigned URL upload with live XMLHttpRequest progress
      const { uploadUrl, publicUrl } = await getPresignedUrlFn({
        data: { filename: file.name, contentType, folder: "course-thumbnails" },
      });

      setUploadStatusText("Uploading thumbnail to S3...");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", contentType);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
            const loadedKb = (event.loaded / 1024).toFixed(0);
            const totalKb = (event.total / 1024).toFixed(0);
            setUploadStatusText(`Uploading: ${loadedKb} KB / ${totalKb} KB (${percent}%)`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            setUploadStatusText("Upload complete!");
            resolve();
          } else {
            reject(new Error(`Direct upload status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Direct upload failed via network error"));
        xhr.send(file);
      });

      setFormData((prev) => ({ ...prev, thumbnail: publicUrl }));
    } catch (directErr: unknown) {
      console.warn(
        "Direct S3 upload failed/blocked by CORS. Falling back to server-side S3 upload...",
        directErr,
      );

      try {
        setUploadStatusText("Using server-side fallback...");
        setUploadProgress(30);

        // 2. Automatic Fallback: Server-side S3 upload (Bypasses CORS completely)
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const readPercent = Math.round((event.loaded / event.total) * 50);
              setUploadProgress(readPercent);
            }
          };
          reader.onload = () => {
            const result = reader.result as string;
            setUploadProgress(60);
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        setUploadProgress(80);

        const { publicUrl } = await uploadFileToS3Fn({
          data: {
            filename: file.name,
            base64Data,
            contentType,
            folder: "course-thumbnails",
          },
        });

        setUploadProgress(100);
        setUploadStatusText("Upload complete!");
        setFormData((prev) => ({ ...prev, thumbnail: publicUrl }));
      } catch (fallbackErr: unknown) {
        alert(
          `S3 Upload failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
        );
        setUploadProgress(null);
        setUploadStatusText("");
      }
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleTogglePublished = async (courseId: string, currentStatus: boolean) => {
    await toggleCoursePublishedFn({ data: { courseId, published: !currentStatus } });
    router.invalidate();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      !confirm("Delete this course? This removes its lessons, enrollments, payments, and reviews.")
    )
      return;
    try {
      await deleteCourseFn({ data: { courseId } });
      router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return alert("Select a category!");

    const { thumbnail, ...rest } = formData;
    try {
      if (editingId) {
        await updateCourseFn({ data: { courseId: editingId, ...rest, thumbnail } });
      } else {
        await createCourseFn({ data: { ...rest, thumbnail } });
      }
      setIsCreating(false);
      setEditingId(null);
      setFormData(emptyForm);
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save course";
      alert(
        /(Invalid `prisma\.|Unknown argument)/.test(message)
          ? "Failed to save course. Please try again."
          : message,
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Course Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage academy training modules.
          </p>
        </div>
        <Button variant="hero" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>{editingId ? "Edit Course" : "Create New Course"}</PanelTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Title
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
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Price (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                >
                  <option value="" disabled>
                    Select category...
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as "FULL" | "MODULE" })
                  }
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                >
                  <option value="FULL">Full Course</option>
                  <option value="MODULE">Module</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Thumbnail Image (Upload to S3 or paste URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => {
                    setFormData({ ...formData, thumbnail: e.target.value });
                    setUploadProgress(null);
                  }}
                  placeholder="https://... or upload a thumbnail image ->"
                  className="flex-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
                <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors shrink-0">
                  {isUploadingThumbnail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {uploadProgress ?? 0}% Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Upload S3 Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingThumbnail}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Real-time Upload Progress Bar */}
              {isUploadingThumbnail && uploadProgress !== null && (
                <div className="mt-3 space-y-2 rounded-lg border border-neon-cyan/30 bg-surface-2/90 p-3.5 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-neon-cyan">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" />
                      {uploadStatusText || "Uploading Image..."}
                    </span>
                    <span className="font-mono text-xs font-bold text-neon-cyan glow-text">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/80 border border-neon-cyan/30">
                    <div
                      className="h-full bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-lime transition-all duration-150 ease-out shadow-[0_0_12px_rgba(0,243,255,0.7)]"
                      style={{ width: `${Math.max(uploadProgress, 2)}%` }}
                    />
                  </div>
                </div>
              )}

              {!isUploadingThumbnail && uploadProgress === 100 && (
                <div className="mt-2.5 flex items-center gap-2 rounded-md border border-neon-lime/30 bg-neon-lime/10 px-3 py-2 text-xs font-semibold text-neon-lime animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-lime" />
                  <span>Thumbnail uploaded successfully!</span>
                </div>
              )}

              {formData.thumbnail && (
                <div className="mt-2.5 flex items-center gap-3">
                  <img
                    src={formData.thumbnail}
                    alt="Thumbnail preview"
                    className="h-16 w-24 rounded-lg border border-border object-cover"
                  />
                  <span className="text-xs text-muted-foreground break-all">
                    {formData.thumbnail}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setFormData(emptyForm);
                  setUploadProgress(null);
                  setUploadStatusText("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                {editingId ? "Save Changes" : "Create Database Entry"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Course Title</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-10 w-14 shrink-0 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-14 shrink-0 place-items-center rounded-md border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan/60">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{course.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                        {course.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-0.5 text-xs text-neon-purple">
                    {course.category?.name || "Uncategorized"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {course.type === "MODULE" ? (
                    <span className="inline-flex items-center rounded-full border border-neon-amber/30 bg-neon-amber/10 px-2 py-0.5 text-xs text-neon-amber">
                      Module
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-xs text-neon-cyan">
                      Full
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-display text-neon-cyan glow-text">₹{course.price}</td>
                <td className="px-6 py-4 text-center">
                  {course.published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-neon-lime/30 bg-neon-lime/10 px-2 py-1 text-xs text-neon-lime">
                      <Eye className="h-3.5 w-3.5" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" /> Draft
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to="/admin/academy/courses/$courseId" params={{ courseId: course.id }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                      >
                        Lessons
                      </Button>
                    </Link>
                    <Button
                      variant={course.published ? "ghost" : "neonPurple"}
                      size="sm"
                      onClick={() => handleTogglePublished(course.id, course.published)}
                    >
                      {course.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10"
                      onClick={() => startEdit(course)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-500 hover:bg-red-500/10"
                      title="Delete course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No courses found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
