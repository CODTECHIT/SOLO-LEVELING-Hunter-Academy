import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getIntroVideosFn, saveIntroVideoFn, deleteIntroVideoFn, getPresignedUrlFn, uploadFileToS3Fn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Video, Plus, Pencil, Trash2, Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/cms/intro-video")({
  loader: async () => {
    return await getIntroVideosFn();
  },
  component: AdminIntroVideos,
});

function AdminIntroVideos() {
  const { videos } = Route.useLoaderData();
  const router = useRouter();

  const empty = { title: "", videoUrl: "", thumbnail: "", active: true };
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const handleFileUpload = async (file: File, field: "videoUrl" | "thumbnail") => {
    const isVideo = field === "videoUrl";
    if (isVideo) setIsUploadingVideo(true);
    else setIsUploadingThumbnail(true);

    const contentType = file.type || (isVideo ? "video/mp4" : "image/jpeg");

    try {
      // 1. Try Direct S3 Presigned URL upload (Zero server bandwidth)
      const { uploadUrl, publicUrl } = await getPresignedUrlFn({
        data: {
          filename: file.name,
          contentType,
          folder: isVideo ? "intro-videos" : "intro-thumbnails",
        },
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!res.ok) throw new Error(`Direct upload status ${res.status}`);

      setForm((prev) => ({ ...prev, [field]: publicUrl }));
    } catch (directErr: any) {
      console.warn("Direct S3 upload failed/blocked by CORS. Falling back to server-side S3 upload...", directErr);

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
            folder: isVideo ? "intro-videos" : "intro-thumbnails",
          },
        });

        setForm((prev) => ({ ...prev, [field]: publicUrl }));
      } catch (fallbackErr: any) {
        alert(`S3 Upload failed: ${fallbackErr.message}`);
      }
    } finally {
      if (isVideo) setIsUploadingVideo(false);
      else setIsUploadingThumbnail(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    setIsCreating(true);
  };
  
  const startEdit = (v: (typeof videos)[number]) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      videoUrl: v.videoUrl,
      thumbnail: v.thumbnail ?? "",
      active: v.active,
    });
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveIntroVideoFn({ data: { id: editingId ?? undefined, ...form, thumbnail: form.thumbnail || undefined, active: form.active } });
    setIsCreating(false);
    setEditingId(null);
    setForm(empty);
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this intro video?")) return;
    await deleteIntroVideoFn({ data: { id } });
    router.invalidate();
  };

  const handleToggleActive = async (v: (typeof videos)[number]) => {
    await saveIntroVideoFn({
      data: {
        id: v.id,
        title: v.title,
        videoUrl: v.videoUrl,
        thumbnail: v.thumbnail ?? undefined,
        active: !v.active,
      },
    });
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Intro Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the landing page welcome videos.</p>
        </div>
        <Button variant="hero" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Video
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>{editingId ? "Edit Video" : "New Video"}</PanelTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Title
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Video (Upload file to S3 or paste URL)
              </label>
              <div className="flex gap-2">
                <input
                  required
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
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
                      if (file) handleFileUpload(file, "videoUrl");
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Thumbnail Image (Upload file to S3 or paste URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://... or upload a thumbnail image ->"
                  className="flex-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
                <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors shrink-0">
                  {isUploadingThumbnail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
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
                      if (file) handleFileUpload(file, "thumbnail");
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-[var(--neon-cyan)]"
              />
              Active on homepage (only the first active is shown)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                {editingId ? "Save Changes" : "Add Video"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Videos</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Video</th>
              <th className="px-6 py-4 font-medium">URL</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {videos.map((v) => (
              <tr key={v.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{v.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  <code className="rounded bg-surface-2 px-2 py-0.5 max-w-[200px] truncate block" title={v.videoUrl}>
                    {v.videoUrl}
                  </code>
                </td>
                <td className="px-6 py-4 text-center">
                  {v.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-neon-lime/30 bg-neon-lime/10 px-2 py-1 text-xs text-neon-lime">
                      <Eye className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" /> Hidden
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                      onClick={() => handleToggleActive(v)}
                    >
                      {v.active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10"
                      onClick={() => startEdit(v)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(v.id)}
                      className="text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No intro videos yet. Add the first one for the homepage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
