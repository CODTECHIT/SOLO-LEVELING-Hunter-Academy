import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getSlidersFn, saveSliderFn, deleteSliderFn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/cms/sliders")({
  loader: async () => {
    return await getSlidersFn();
  },
  component: AdminCmsSliders,
});

function AdminCmsSliders() {
  const { sliders } = Route.useLoaderData();
  const router = useRouter();

  const empty = { title: "", subtitle: "", imageUrl: "", linkUrl: "", active: true };
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    setIsCreating(true);
  };
  const startEdit = (s: (typeof sliders)[number]) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? "",
      imageUrl: s.imageUrl ?? "",
      linkUrl: s.linkUrl ?? "",
      active: s.active,
    });
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSliderFn({ data: { id: editingId ?? undefined, ...form, active: form.active } });
    setIsCreating(false);
    setEditingId(null);
    setForm(empty);
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slider?")) return;
    await deleteSliderFn({ data: { id } });
    router.invalidate();
  };

  const handleToggleActive = async (s: (typeof sliders)[number]) => {
    await saveSliderFn({
      data: {
        id: s.id,
        title: s.title,
        subtitle: s.subtitle ?? undefined,
        imageUrl: s.imageUrl ?? undefined,
        linkUrl: s.linkUrl ?? undefined,
        active: !s.active,
      },
    });
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Sliders & Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage homepage hero banners.</p>
        </div>
        <Button variant="hero" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Slider
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>{editingId ? "Edit Slider" : "New Slider"}</PanelTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
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
                  Subtitle
                </label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Link URL
              </label>
              <input
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-[var(--neon-cyan)]"
              />
              Active on homepage
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
                {editingId ? "Save Changes" : "Add Slider"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Hero Images</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Slider</th>
              <th className="px-6 py-4 font-medium">Link</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sliders.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon-lime/30 bg-neon-lime/10 text-neon-lime">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">{s.title}</div>
                      {s.subtitle && (
                        <div className="truncate text-xs text-muted-foreground max-w-[200px]">
                          {s.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {s.linkUrl ? (
                    <code className="rounded bg-surface-2 px-2 py-0.5">{s.linkUrl}</code>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {s.active ? (
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
                      onClick={() => handleToggleActive(s)}
                    >
                      {s.active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10"
                      onClick={() => startEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(s.id)}
                      className="text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sliders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No sliders yet. Add your first homepage banner.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
