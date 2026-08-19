import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getIntroVideosFn,
  saveIntroVideoFn,
  deleteIntroVideoFn,
} from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Video,
  Play,
  Trash2,
  Edit2,
  Plus,
  X,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/academy/cms/intro-video")({
  loader: async () => {
    return await getIntroVideosFn();
  },
  head: () => ({
    meta: [{ title: "Intro Video Management — Control Hub" }],
  }),
  component: AdminIntroVideoPage,
});

function getYouTubeEmbedUrl(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return url;
}

function AdminIntroVideoPage() {
  const { videos } = Route.useLoaderData();
  const router = useRouter();

  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (vid: any | null) => {
    if (vid) {
      setEditingVideo(vid);
      setTitle(vid.title);
      setVideoUrl(vid.videoUrl);
      setThumbnail(vid.thumbnail || "");
      setActive(vid.active ?? true);
      setOrder(vid.order ?? 0);
    } else {
      setEditingVideo({ id: undefined });
      setTitle("");
      setVideoUrl("");
      setThumbnail("");
      setActive(true);
      setOrder(videos.length + 1);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Please provide both a title and a valid video URL");
      return;
    }

    try {
      setIsSaving(true);
      await saveIntroVideoFn({
        data: {
          id: editingVideo?.id,
          title: title.trim(),
          videoUrl: videoUrl.trim(),
          thumbnail: thumbnail.trim() || undefined,
          active,
          order: Number(order) || 0,
        },
      });
      toast.success(editingVideo?.id ? "Intro video updated" : "Intro video created");
      setEditingVideo(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save intro video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, t: string) => {
    if (!confirm(`Delete video: "${t}"?`)) return;
    try {
      await deleteIntroVideoFn({ data: { id } });
      toast.success("Intro video removed");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete video");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="h-6 w-6 text-neon-purple" />
            Academy Intro & Promo Video
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage promotional video embeds, homepage teasers, and academy orientation videos.
          </p>
        </div>

        <Button
          variant="neonPurple"
          size="sm"
          onClick={() => startEdit(null)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Intro Video
        </Button>
      </div>

      {/* Video Editor Panel */}
      {editingVideo && (
        <Panel accent="purple" className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-display text-base font-bold text-foreground">
              {editingVideo.id ? "Edit Intro Video" : "Add New Intro Video"}
            </h3>
            <button
              onClick={() => setEditingVideo(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Video Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solo Hunter Awakening Orientation Trailer"
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Video URL (YouTube / MP4 / CDN Link)
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Poster / Thumbnail Image URL (Optional)
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="w-32">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none font-mono"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-border text-neon-purple focus:ring-neon-purple"
                />
                Active (Display on site)
              </label>
            </div>

            {/* Live Preview Embed */}
            {videoUrl && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Live Preview:
                </p>
                <div className="aspect-video max-w-md rounded-xl overflow-hidden border border-border bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(videoUrl)}
                    title="Video Preview"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingVideo(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="neonPurple"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Video"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* Videos List */}
      <div className="grid gap-6 sm:grid-cols-2">
        {videos.map((vid: any) => (
          <Panel
            key={vid.id}
            accent={vid.active ? "purple" : undefined}
            className="space-y-4"
          >
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-border/80 relative group">
              <iframe
                src={getYouTubeEmbedUrl(vid.videoUrl)}
                title={vid.title}
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {vid.title}
                  </h3>
                  {vid.active ? (
                    <span className="inline-flex items-center rounded-full bg-neon-lime/10 border border-neon-lime/30 px-2 py-0.5 text-[10px] font-semibold text-neon-lime">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-xs mt-1">
                  {vid.videoUrl}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(vid)}
                  className="text-xs text-neon-purple hover:bg-neon-purple/10"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(vid.id, vid.title)}
                  className="text-xs text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Panel>
        ))}

        {videos.length === 0 && (
          <Panel className="col-span-full p-12 text-center text-muted-foreground">
            <Video className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p>No intro videos added yet. Click "Add Intro Video" to configure one.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
