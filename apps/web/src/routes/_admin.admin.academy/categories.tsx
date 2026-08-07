import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getAdminCategoriesFn,
  createCategoryFn,
  updateCategoryFn,
  deleteCategoryFn,
} from "@/server/admin";
import { getPresignedUrlFn, uploadFileToS3Fn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/categories")({
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
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleFileUpload = async (file: File) => {
    const contentType = file.type || "image/jpeg";
    setIsUploadingImage(true);

    try {
      // 1. Try Direct S3 Presigned URL upload (Zero server bandwidth)
      const { uploadUrl, publicUrl } = await getPresignedUrlFn({
        data: { filename: file.name, contentType, folder: "category-images" },
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!res.ok) throw new Error(`Direct upload status ${res.status}`);

      setImage(publicUrl);
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
            folder: "category-images",
          },
        });

        setImage(publicUrl);
      } catch (fallbackErr: unknown) {
        alert(
          `S3 Upload failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
        );
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setName("");
    setImage("");
    setError(null);
    setIsCreating(true);
  };

  const startEdit = (id: string, currentName: string, currentImage: string | null) => {
    setEditingId(id);
    setName(currentName);
    setImage(currentImage ?? "");
    setError(null);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    const isDuplicate = categories.some(
      (c) => c.id !== editingId && c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      setError("Category already exists.");
      return;
    }

    try {
      if (editingId) {
        await updateCategoryFn({ data: { id: editingId, name, image } });
      } else {
        await createCategoryFn({ data: { name, image } });
      }
      setIsCreating(false);
      setEditingId(null);
      setName("");
      setImage("");
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save category";
      setError(
        /(Invalid `prisma\.|Unknown argument)/.test(message)
          ? "Failed to save category. Please try again."
          : message,
      );
    }
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
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Category Name
              </label>
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Swordsmanship, Magic, Strategy"
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Category Image (Upload to S3 or paste URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... or upload an image ->"
                  className="flex-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
                <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-xs font-bold text-neon-cyan hover:bg-neon-cyan/20 transition-colors shrink-0">
                  {isUploadingImage ? (
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
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {image && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={image}
                    alt="Category preview"
                    className="h-16 w-16 rounded-lg border border-border object-cover"
                  />
                  <span className="text-xs text-muted-foreground break-all">{image}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setName("");
                  setImage("");
                  setError(null);
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
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
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
                      onClick={() => startEdit(category.id, category.name, category.image)}
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
