import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getCmsPagesFn, saveCmsPageFn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/cms/pages")({
  loader: async () => {
    return await getCmsPagesFn();
  },
  component: AdminCmsPages,
});

function AdminCmsPages() {
  const { pages } = Route.useLoaderData();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const startEdit = (page: (typeof pages)[number] | null) => {
    if (page) {
      setSlug(page.slug);
      setTitle(page.title);
      setContent(page.content);
    } else {
      setSlug("");
      setTitle("");
      setContent("");
    }
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCmsPageFn({ data: { slug, title, content } });
    setEditing(false);
    setSlug("");
    setTitle("");
    setContent("");
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Pages CMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit content for static pages.</p>
        </div>
        <Button variant="hero" onClick={() => startEdit(null)}>
          <FileText className="mr-2 h-4 w-4" /> New Page
        </Button>
      </div>

      {editing && (
        <Panel accent="cyan" className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-display text-sm uppercase tracking-widest text-neon-cyan">
              New Page
            </h3>
          </div>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Slug
                </label>
                <input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="about"
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Content
              </label>
              <textarea
                required
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write page content..."
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                Save Page
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Static Pages</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Page</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Last Updated</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((page) => (
              <tr key={page.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-neon-lime/30 bg-neon-lime/10 text-neon-lime">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground">{page.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="rounded bg-surface-2 px-2 py-1 text-xs text-muted-foreground">
                    /{page.slug}
                  </code>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(page.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10"
                    onClick={() => startEdit(page)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No CMS pages yet. Click "New Page" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
