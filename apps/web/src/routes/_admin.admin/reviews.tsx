import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminReviewsFn, deleteReviewFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Star, Trash2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/reviews")({
  loader: async () => {
    return await getAdminReviewsFn();
  },
  component: AdminReviews,
});

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? "fill-neon-amber text-neon-amber" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

function AdminReviews() {
  const { reviews, avgRating } = Route.useLoaderData();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this review?")) return;
    await deleteReviewFn({ data: { id } });
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Reviews Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and moderate student feedback.</p>
      </div>

      <Panel className="flex items-center justify-between">
        <div>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Average Rating
          </p>
          <p className="font-display text-3xl font-bold text-neon-amber">
            {avgRating.toFixed(1)} / 5
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-5 w-5" />
          <span className="font-display text-xl font-bold text-foreground">{reviews.length}</span>
          <span className="text-xs uppercase tracking-wider">reviews</span>
        </div>
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Recent Reviews</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Course</th>
              <th className="px-6 py-4 font-medium">Rating</th>
              <th className="px-6 py-4 font-medium">Comment</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{r.user?.name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-neon-cyan">{r.course?.title ?? "—"}</td>
                <td className="px-6 py-4">
                  <Stars rating={r.rating} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground max-w-sm line-clamp-2">
                  {r.comment ?? "—"}
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(r.id)}
                    className="text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No reviews yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
