import { createFileRoute } from "@tanstack/react-router";
import { getAdminPaymentsFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Coins, CheckCircle2, Circle, XCircle, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/academy/reports")({
  loader: async () => {
    return await getAdminPaymentsFn();
  },
  component: AdminReports,
});

function AdminReports() {
  const { payments, totalRevenue, paidCount, pendingCount, failedCount } = Route.useLoaderData();

  const statusTone = (status: string) =>
    status === "PAID"
      ? "border-neon-lime/40 bg-neon-lime/10 text-neon-lime"
      : status === "FAILED"
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-neon-amber/40 bg-neon-amber/10 text-neon-amber";

  const card = (label: string, value: string | number, accent: string, Icon: LucideIcon) => (
    <Panel className="flex items-center gap-4">
      <div className={`grid h-12 w-12 place-items-center rounded-xl border bg-surface-2 ${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className={`font-display text-2xl font-bold ${accent.split(" ")[0]}`}>{value}</p>
      </div>
    </Panel>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Financial Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View academy revenue and transaction history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {card(
          "Total Revenue",
          `₹${totalRevenue.toLocaleString("en-IN")}`,
          "text-neon-amber border-neon-amber/50",
          Coins,
        )}
        {card("Paid", paidCount, "text-neon-lime border-neon-lime/50", CheckCircle2)}
        {card("Pending", pendingCount, "text-neon-cyan border-neon-cyan/50", Circle)}
        {card("Failed", failedCount, "text-red-500 border-red-500/50", XCircle)}
      </div>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Revenue Analytics</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Order</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{p.user?.name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{p.user?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <code className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                    {p.razorpayOrderId}
                  </code>
                </td>
                <td className="px-6 py-4 font-display text-neon-amber glow-text">
                  ₹{p.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusTone(p.status)}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
