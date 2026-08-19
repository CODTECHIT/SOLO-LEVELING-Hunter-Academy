import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminReviewsFn, deleteReviewFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Star,
  Trash2,
  MessageSquare,
  Search,
  Filter,
  ShieldCheck,
  BookOpen,
  User,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/academy/reviews")({
  loader: async () => {
    return await getAdminReviewsFn();
  },
  head: () => ({
    meta: [{ title: "Reviews Moderation — Control Hub" }],
  }),
  component: AdminReviews,
});

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating
              ? "fill-neon-amber text-neon-amber drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function AdminReviews() {
  const { reviews, avgRating } = Route.useLoaderData();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Distinct courses
  const courseTitles = Array.from(
    new Set(
      reviews
        .map((r: any) => r.course?.title)
        .filter((t: any): t is string => Boolean(t))
    )
  );

  // Rating Distribution
  const starCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r: any) => r.rating === stars).length,
    percentage: reviews.length
      ? Math.round(
          (reviews.filter((r: any) => r.rating === stars).length /
            reviews.length) *
            100
        )
      : 0,
  }));

  const handleDelete = async (id: string, authorName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the review by "${authorName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsDeletingId(id);
      await deleteReviewFn({ data: { id } });
      toast.success("Review permanently removed by moderator.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter((r: any) => {
    const matchesRating =
      ratingFilter === "ALL" || r.rating === ratingFilter;
    const matchesCourse =
      courseFilter === "ALL" || r.course?.title === courseFilter;
    const matchesSearch =
      !search ||
      (r.user?.name && r.user.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.user?.email && r.user.email.toLowerCase().includes(search.toLowerCase())) ||
      (r.course?.title &&
        r.course.title.toLowerCase().includes(search.toLowerCase())) ||
      (r.comment && r.comment.toLowerCase().includes(search.toLowerCase()));

    return matchesRating && matchesCourse && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-neon-amber" />
            Reviews Moderation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit, moderate, and remove student course feedback across the academy.
          </p>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Average Rating */}
        <Panel accent="amber" className="space-y-3">
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Overall Rating
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-black text-neon-amber glow-text">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              out of 5.0
            </span>
          </div>
          <Stars rating={Math.round(avgRating)} />
        </Panel>

        {/* Total Reviews */}
        <Panel accent="cyan" className="space-y-3">
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Total Feedback Logged
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-black text-neon-cyan glow-text">
              {reviews.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              verified submissions
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 text-neon-cyan" />
            Logged-in student accounts only
          </div>
        </Panel>

        {/* Star Rating Breakdown */}
        <Panel className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">
            Rating Distribution
          </p>
          <div className="space-y-1.5 text-xs">
            {starCounts.map((s) => (
              <div key={s.stars} className="flex items-center gap-2">
                <span className="w-8 font-mono text-muted-foreground flex items-center gap-0.5">
                  {s.stars} <Star className="h-2.5 w-2.5 fill-neon-amber text-neon-amber inline" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full bg-neon-amber transition-all duration-500 rounded-full"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-[11px] text-muted-foreground">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Moderation Controls & Table */}
      <Panel className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PanelTitle>All Reviews ({filteredReviews.length})</PanelTitle>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student, course, or comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) =>
                setRatingFilter(
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                )
              }
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★</option>
              <option value="3">3 Stars ★★★</option>
              <option value="2">2 Stars ★★</option>
              <option value="1">1 Star ★</option>
            </select>

            {/* Course Filter */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none max-w-[200px] truncate"
            >
              <option value="ALL">All Courses</option>
              {courseTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Hunter / Student</th>
                <th className="px-6 py-4 font-medium">Course Vault</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Feedback Comment</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReviews.map((r: any) => (
                <tr key={r.id} className="transition-colors hover:bg-surface-2/30">
                  {/* Student */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold font-display uppercase text-xs">
                        {r.user?.name ? r.user.name.substring(0, 2) : "AN"}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {r.user?.name ?? "Unknown Hunter"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {r.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Course */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-neon-cyan font-medium">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {r.course?.title ?? "General Course"}
                      </span>
                    </div>
                  </td>

                  {/* Rating Stars */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Stars rating={r.rating} />
                      <span className="text-[11px] font-mono text-neon-amber font-semibold">
                        {r.rating}.0 / 5
                      </span>
                    </div>
                  </td>

                  {/* Comment */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground/90 max-w-md line-clamp-3 leading-relaxed">
                      {r.comment ? (
                        r.comment
                      ) : (
                        <span className="text-muted-foreground italic">
                          No written feedback provided.
                        </span>
                      )}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeletingId === r.id}
                      onClick={() =>
                        handleDelete(r.id, r.user?.name ?? "Hunter")
                      }
                      className="border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredReviews.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No reviews match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
