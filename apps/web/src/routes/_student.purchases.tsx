import { createFileRoute } from "@tanstack/react-router";
import { getPurchasesFn } from "@/server/courses";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Receipt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_student/purchases")({
  loader: async () => {
    return await getPurchasesFn();
  },
  head: () => ({
    meta: [{ title: "Purchase History — Cyber Tech Academy" }],
  }),
  component: PurchasesPage,
});

type Purchase = Awaited<ReturnType<typeof getPurchasesFn>>[number];

function downloadReceipt(p: Purchase) {
  const orderId = p.id;
  const courseTitle = p.courseTitle || "Course";
  const amount = p.amount.toLocaleString("en-IN");
  const currency = p.currency || "INR";
  const date = new Date(p.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const status = p.status || "PAID";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt ${orderIdSegment(orderId)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; max-width: 560px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .brand { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #64748b; }
  .meta { margin-top: 28px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .row span:first-child { color: #64748b; }
  .total { display: flex; justify-content: space-between; margin-top: 16px; font-size: 18px; font-weight: 700; }
  .note { margin-top: 28px; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="brand">Cyber Tech Academy</div>
  <h1>Payment Receipt</h1>
  <div class="meta">
    <div class="row"><span>Order ID</span><span>${orderId}</span></div>
    <div class="row"><span>Date</span><span>${date}</span></div>
    <div class="row"><span>Course / Pathway</span><span>${escapeHtml(courseTitle)}</span></div>
    <div class="row"><span>Transaction ID</span><span>${orderId}</span></div>
    <div class="row"><span>Status</span><span>${status}</span></div>
  </div>
  <div class="total"><span>Amount Paid</span><span>₹${amount} ${currency}</span></div>
  <p class="note">This is a computer-generated receipt. Arise, Hunter.</p>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${orderId}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function orderIdSegment(id: string) {
  return id.split("-")[0] || id;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function PurchasesPage() {
  const purchases = Route.useLoaderData();

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="w-8 h-8 text-neon-cyan" />
        <h1 className="font-display text-2xl font-bold text-foreground">Purchase History</h1>
      </div>

      <Panel>
        <PanelTitle>Transaction Log</PanelTitle>
        <div className="mt-4">
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No purchases found.</div>
          ) : (
            <>
              {/* Mobile Card List (< sm screens) */}
              <div className="space-y-3 sm:hidden">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="p-4 rounded-xl border border-border/70 bg-surface-2/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-bold text-sm text-foreground line-clamp-2">
                          {purchase.courseTitle}
                        </h4>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          Order ID: {purchase.id.split("-")[0]}...
                        </p>
                      </div>
                      <span className="font-display font-bold text-neon-cyan text-sm shrink-0">
                        ₹{purchase.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground font-mono">
                        {new Date(purchase.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-neon-cyan hover:bg-neon-cyan/10 font-semibold"
                        onClick={() => downloadReceipt(purchase)}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Download Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= sm screens) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="pb-3 font-medium">Order ID</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Course/Pathway</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="transition-colors hover:bg-background/50">
                        <td className="py-4 font-mono text-xs text-muted-foreground">
                          {purchase.id.split("-")[0]}...
                        </td>
                        <td className="py-4">
                          {new Date(purchase.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 font-medium text-foreground">{purchase.courseTitle}</td>
                        <td className="py-4 text-right font-display text-neon-cyan font-bold">
                          ₹{purchase.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Download Receipt"
                            aria-label={`Download receipt for ${purchase.courseTitle}`}
                            onClick={() => downloadReceipt(purchase)}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
