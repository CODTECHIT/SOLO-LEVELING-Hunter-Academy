import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getRefundsFn, submitRefundFn, getPurchasesFn } from "@/server/courses";
import { Panel, PanelTitle, StatusTag } from "@/components/site/ui-bits";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_student/refunds")({
  loader: async () => {
    const [refunds, purchases] = await Promise.all([
      getRefundsFn(),
      getPurchasesFn()
    ]);
    return { refunds, purchases };
  },
  head: () => ({
    meta: [{ title: "Refunds — Cyber Tech Academy" }],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  const { refunds, purchases } = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exclude purchases that already have a refund request
  const eligiblePurchases = purchases.filter(
    (p) => !refunds.some((r) => r.paymentId === p.id)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const paymentId = formData.get("paymentId") as string;
    const reason = formData.get("reason") as string;

    if (!paymentId || !reason) {
      alert("Please select a purchase and provide a reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitRefundFn({ data: { paymentId, reason } });
      alert("Refund request submitted successfully.");
      router.invalidate();
    } catch (error) {
      console.error(error);
      alert("Failed to submit refund request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-8 h-8 text-neon-amber" />
        <h1 className="font-display text-2xl font-bold text-foreground">Refund Requests</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel accent="amber">
          <PanelTitle right={<AlertTriangle className="w-4 h-4 text-neon-amber" />}>Request a Refund</PanelTitle>
          <div className="mt-4 text-sm text-muted-foreground mb-6">
            You can request a refund within 30 days of purchase, provided you have not completed more than 20% of the course.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Select Purchase</label>
              <select
                name="paymentId"
                required
                className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-amber focus:outline-none focus:ring-1 focus:ring-neon-amber"
              >
                <option value="">-- Choose a purchase --</option>
                {eligiblePurchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.courseTitle} - ₹{p.amount.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
              {eligiblePurchases.length === 0 && (
                <p className="mt-2 text-xs text-neon-amber">You don't have any eligible purchases to refund.</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Reason for Refund</label>
              <textarea
                name="reason"
                required
                rows={4}
                className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-amber focus:outline-none focus:ring-1 focus:ring-neon-amber"
                placeholder="Please explain why you are requesting a refund..."
              ></textarea>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full bg-neon-amber/20 text-neon-amber hover:bg-neon-amber/30 hover:shadow-neon-amber/20"
              disabled={isSubmitting || eligiblePurchases.length === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Panel>

        <Panel>
          <PanelTitle>Refund History</PanelTitle>
          <div className="mt-4">
            {refunds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No refund requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {refunds.map((refund) => (
                  <div key={refund.id} className="rounded-xl border border-border/70 bg-background/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-bold text-foreground">{refund.courseTitle}</h3>
                      <StatusTag status={refund.status === "PENDING" ? "In Progress" : refund.status === "APPROVED" ? "Completed" : "Locked"} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">"{refund.reason}"</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <span>Submitted on {new Date(refund.createdAt).toLocaleDateString()}</span>
                      <span className="font-medium">
                        Status: <span className={refund.status === "APPROVED" ? "text-neon-cyan" : refund.status === "REJECTED" ? "text-red-400" : "text-neon-amber"}>{refund.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
