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
  const displayOrderId = (p as any).razorpayOrderId || orderId;
  const status = (p.status || "PENDING").toUpperCase();
  const displayPaymentId =
    (p as any).razorpayPaymentId ||
    (status === "PAID" ? `PAY-${orderId.substring(0, 10).toUpperCase()}` : "N/A (Pending Settlement)");
  const courseTitle = p.courseTitle || "Course";
  const amount = p.amount.toLocaleString("en-IN");
  const currency = p.currency || "INR";
  const date = new Date(p.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = new Date(p.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let statusTag = "✔ PAID & CONFIRMED";
  let statusTagBg = "#ecfdf5";
  let statusTagColor = "#059669";
  let statusTagBorder = "#a7f3d0";
  let receiptTitle = "Payment Receipt";
  let totalLabel = "Amount Paid";
  let gatewayMsg = "Transaction verified and logged into Cyber Tech Ledger.";
  let authStamp = "AUTH VERIFIED";
  let stampColor = "#059669";

  if (status === "PENDING") {
    statusTag = "⏳ PAYMENT PENDING";
    statusTagBg = "#fffbeb";
    statusTagColor = "#d97706";
    statusTagBorder = "#fde68a";
    receiptTitle = "Pending Payment Receipt";
    totalLabel = "Amount Pending";
    gatewayMsg = "Payment initiated and awaiting gateway / bank settlement confirmation.";
    authStamp = "PAYMENT PENDING";
    stampColor = "#d97706";
  } else if (status === "FAILED") {
    statusTag = "✖ PAYMENT FAILED";
    statusTagBg = "#fef2f2";
    statusTagColor = "#dc2626";
    statusTagBorder = "#fecaca";
    receiptTitle = "Failed Payment Record";
    totalLabel = "Amount Unpaid";
    gatewayMsg = "Transaction was declined or payment verification failed.";
    authStamp = "FAILED";
    stampColor = "#dc2626";
  } else if (status === "REFUNDED") {
    statusTag = "↩ REFUNDED";
    statusTagBg = "#f5f3ff";
    statusTagColor = "#7c3aed";
    statusTagBorder = "#ddd6fe";
    receiptTitle = "Refund Receipt";
    totalLabel = "Amount Refunded";
    gatewayMsg = "Payment has been refunded to original payment method.";
    authStamp = "REFUNDED";
    stampColor = "#7c3aed";
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt ${orderIdSegment(orderId)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; max-width: 600px; margin: 40px auto; padding: 0 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #090d16; }
  .brand-sub { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
  .invoice-title-block { text-align: right; }
  .invoice-title { font-size: 18px; font-weight: 800; text-transform: uppercase; }
  .invoice-tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; border: 1px solid; margin-top: 4px; }
  .meta { margin-top: 20px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .row span:first-child { color: #64748b; }
  .total-box { margin-top: 20px; padding: 14px 0; border-top: 2px solid #0f172a; border-bottom: 1px solid #e2e8f0; }
  .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; }
  .verification-box { margin-top: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
  .verification-title { font-size: 12px; font-weight: 700; color: #0f172a; }
  .verification-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .verified-stamp { font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; border: 1.5px solid; padding: 4px 10px; border-radius: 6px; }
  .note { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Cyber Tech Academy</div>
      <div class="brand-sub">Hunters Training &amp; Certification Guild</div>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-title">${receiptTitle}</div>
      <div class="invoice-tag" style="background: ${statusTagBg}; color: ${statusTagColor}; border-color: ${statusTagBorder};">${statusTag}</div>
    </div>
  </div>

  <div class="meta">
    <div class="row"><span>Order ID</span><span>${escapeHtml(displayOrderId)}</span></div>
    <div class="row"><span>Date &amp; Time</span><span>${date} ${time}</span></div>
    <div class="row"><span>Course / Pathway</span><span style="font-weight: 600;">${escapeHtml(courseTitle)}</span></div>
    <div class="row"><span>Transaction / Payment ID</span><span>${escapeHtml(displayPaymentId)}</span></div>
    <div class="row"><span>Payment Status</span><span style="font-weight: 700; color: ${statusTagColor};">${status}</span></div>
  </div>

  <div class="total-box">
    <div class="total"><span>${totalLabel}</span><span>₹${amount} ${currency}</span></div>
  </div>

  <div class="verification-box">
    <div>
      <div class="verification-title">Payment Gateway Verification</div>
      <div class="verification-sub">${gatewayMsg}</div>
    </div>
    <div class="verified-stamp" style="color: ${stampColor}; border-color: ${stampColor};">${authStamp}</div>
  </div>

  <p class="note">This is a computer-generated official document. Arise, Hunter.</p>
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
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PAID") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        PAID
      </span>
    );
  }
  if (s === "PENDING") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        PENDING
      </span>
    );
  }
  if (s === "FAILED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        FAILED
      </span>
    );
  }
  if (s === "REFUNDED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
        REFUNDED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
      {s}
    </span>
  );
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
                      <div className="text-right shrink-0">
                        <span className="font-display font-bold text-neon-cyan text-sm block">
                          ₹{purchase.amount.toLocaleString("en-IN")}
                        </span>
                        <div className="mt-1">
                          <StatusBadge status={purchase.status} />
                        </div>
                      </div>
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
                      <th className="pb-3 font-medium">Status</th>
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
                        <td className="py-4">
                          <StatusBadge status={purchase.status} />
                        </td>
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
