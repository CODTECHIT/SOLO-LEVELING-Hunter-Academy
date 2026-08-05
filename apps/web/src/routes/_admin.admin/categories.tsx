import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getAdminCategoriesFn,
  createCategoryFn,
  updateCategoryFn,
  deleteCategoryFn,
} from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { FolderTree, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/categories")({
  loader: async () => {
    return await getAdminCategoriesFn();
  },
  component: AdminCategories,
});

function AdminCategories() {
  const { categories } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const startCreate = () => {
    setEditingId(null);
    setName("");
    setIsCreating(true);
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setName(currentName);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateCategoryFn({ data: { id: editingId, name } });
    } else {
      await createCategoryFn({ data: { name } });
    }
    setIsCreating(false);
    setEditingId(null);
    setName("");
    router.invalidate();
  };

  const handleDelete = async (id: string, courseCount: number) => {
    if (courseCount > 0) {
      alert("Cannot delete a category that still has courses. Move or delete its courses first.");
      return;
    }
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategoryFn({ data: { id } });
      router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Category Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage course categories.</p>
        </div>
        <Button variant="hero" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>{editingId ? "Edit Category" : "New Category"}</PanelTitle>
          <form onSubmit={handleSubmit} className="mt-4 flex max-w-xl items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Category Name
              </label>
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Swordsmanship, Magic, Strategy"
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setName("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                {editingId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <PanelTitle
          className="px-6 pt-5"
          right={
            <span className="text-xs text-muted-foreground">{categories.length} categories</span>
          }
        >
          <span className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" /> Categories List
          </span>
        </PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium text-center">Courses</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => (
              <tr key={category.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
                      <FolderTree className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                    {category.slug}
                  </code>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-0.5 text-xs text-neon-purple">
                    <BookOpen className="h-3 w-3" /> {category._count.courses}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                      onClick={() => startEdit(category.id, category.name)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10"
                      onClick={() => handleDelete(category.id, category._count.courses)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No categories yet. Add your first course category above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
