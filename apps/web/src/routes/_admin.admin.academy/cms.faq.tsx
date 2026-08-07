import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getFaqItemsFn, saveFaqItemFn, deleteFaqItemFn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/cms/faq")({
  loader: async () => {
    return await getFaqItemsFn();
  },
  component: AdminCmsFaq,
});

function AdminCmsFaq() {
  const { faqs } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const startCreate = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setIsCreating(true);
  };
  const startEdit = (f: (typeof faqs)[number]) => {
    setEditingId(f.id);
    setQuestion(f.question);
    setAnswer(f.answer);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveFaqItemFn({ data: { id: editingId ?? undefined, question, answer } });
    setIsCreating(false);
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ entry?")) return;
    await deleteFaqItemFn({ data: { id } });
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">FAQ Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage frequently asked questions.</p>
        </div>
        <Button variant="hero" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>{editingId ? "Edit Question" : "New Question"}</PanelTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Question
              </label>
              <input
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Answer
              </label>
              <textarea
                required
                rows={5}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 flex pt-2">
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
                {editingId ? "Save Changes" : "Add Entry"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">FAQ Entries</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Question</th>
              <th className="px-6 py-4 font-medium">Answer</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {faqs.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon-lime/30 bg-neon-lime/10 text-neon-lime">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground">{f.question}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground max-w-md line-clamp-2">
                  {f.answer}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10"
                      onClick={() => startEdit(f)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(f.id)}
                      className="text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {faqs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                  No FAQ entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
