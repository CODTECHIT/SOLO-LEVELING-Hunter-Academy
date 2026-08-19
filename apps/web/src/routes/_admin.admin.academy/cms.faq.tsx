import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  getFaqItemsFn,
  saveFaqItemFn,
  deleteFaqItemFn,
} from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  BookOpen,
  Globe,
  Filter,
  Search,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/academy/cms/faq")({
  loader: async () => {
    return await getFaqItemsFn();
  },
  head: () => ({
    meta: [{ title: "FAQ Management (Global & Per Course) — Control Hub" }],
  }),
  component: AdminFaqPage,
});

function AdminFaqPage() {
  const { faqs, courses } = Route.useLoaderData();
  const router = useRouter();

  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("GLOBAL");
  const [order, setOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Filter state
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const startEdit = (faq: any | null) => {
    if (faq) {
      setEditingFaq(faq);
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setSelectedCourseId(faq.courseId || "GLOBAL");
      setOrder(faq.order ?? 0);
    } else {
      setEditingFaq({ id: undefined });
      setQuestion("");
      setAnswer("");
      setSelectedCourseId("GLOBAL");
      setOrder(faqs.length + 1);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error("Please provide both a question and an answer");
      return;
    }

    try {
      setIsSaving(true);
      await saveFaqItemFn({
        data: {
          id: editingFaq?.id,
          question: question.trim(),
          answer: answer.trim(),
          courseId: selectedCourseId === "GLOBAL" ? null : selectedCourseId,
          order: Number(order) || 0,
        },
      });
      toast.success(
        editingFaq?.id
          ? "FAQ entry updated successfully"
          : "New FAQ entry published"
      );
      setEditingFaq(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, q: string) => {
    if (!confirm(`Delete FAQ: "${q}"?`)) return;
    try {
      await deleteFaqItemFn({ data: { id } });
      toast.success("FAQ removed");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete FAQ");
    }
  };

  const filteredFaqs = faqs.filter((f: any) => {
    const matchesScope =
      scopeFilter === "ALL"
        ? true
        : scopeFilter === "GLOBAL"
          ? !f.courseId
          : f.courseId === scopeFilter;

    const matchesSearch =
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      (f.course?.title &&
        f.course.title.toLowerCase().includes(search.toLowerCase()));

    return matchesScope && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-neon-cyan" />
            Frequently Asked Questions (Global & Course-Specific)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage platform FAQs and tailor custom Q&A items for specific courses and modules.
          </p>
        </div>

        <Button
          variant="neon"
          size="sm"
          onClick={() => startEdit(null)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add FAQ Item
        </Button>
      </div>

      {/* Editor Modal / Panel */}
      {editingFaq && (
        <Panel accent="cyan" className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-display text-base font-bold text-foreground">
              {editingFaq.id ? "Edit FAQ Item" : "Create New FAQ Item"}
            </h3>
            <button
              onClick={() => setEditingFaq(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Target Scope / Course Selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Target Scope / Assigned Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none cursor-pointer"
              >
                <option value="GLOBAL">🌐 Global Academy FAQ (Displayed on Main Portal)</option>
                <optgroup label="Course-Specific FAQs">
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      📚 Course: {c.title}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Assigning to a specific course will display this FAQ directly on that course's public and learning page.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Question
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What rank requirements exist for this dungeon training?"
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Answer
              </label>
              <textarea
                required
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Provide a clear, detailed answer..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-32">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingFaq(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="neon"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save FAQ"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* FAQs Ledger & Scope Filter */}
      <Panel className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <PanelTitle>All FAQs ({filteredFaqs.length})</PanelTitle>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search FAQ question or answer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>

            {/* Scope Filter */}
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-neon-cyan focus:outline-none max-w-[240px] truncate"
            >
              <option value="ALL">All FAQ Locations</option>
              <option value="GLOBAL">🌐 Global Academy FAQs Only</option>
              <optgroup label="Course-Specific">
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    📚 {c.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredFaqs.map((faq: any, idx: number) => (
            <div
              key={faq.id}
              className="p-5 flex flex-wrap items-start justify-between gap-4 transition-colors hover:bg-surface-2/30"
            >
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-neon-cyan/15 text-neon-cyan text-xs font-mono font-bold">
                    {faq.order ?? idx + 1}
                  </span>
                  <h4 className="font-display text-base font-bold text-foreground">
                    {faq.question}
                  </h4>
                  {faq.course ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-neon-purple/10 border border-neon-purple/30 px-2 py-0.5 text-[11px] font-medium text-neon-purple">
                      <BookOpen className="h-3 w-3" />
                      {faq.course.title}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-neon-cyan/10 border border-neon-cyan/30 px-2 py-0.5 text-[11px] font-medium text-neon-cyan">
                      <Globe className="h-3 w-3" />
                      Global Portal FAQ
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground pl-8 leading-relaxed">
                  {faq.answer}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(faq)}
                  className="text-xs text-neon-cyan hover:bg-neon-cyan/10"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(faq.id, faq.question)}
                  className="text-xs text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <HelpCircle className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p>No FAQs found for the current search or scope filter.</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
