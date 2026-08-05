import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminRefundsFn, updateRefundStatusFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { ReceiptText, Check, X } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/refunds")({
  loader: async () => {
    return await getAdminRefundsFn();
  },
  component: AdminRefunds,
});

function AdminRefunds() {
  const { refunds } = Route.useLoaderData();
  const router = useRouter();

  const pending = refunds.filter((r) => r.status === "PENDING");
  const approved = refunds.filter((r) => r.status === "APPROVED");
  const rejected = refunds.filter((r) => r.status === "REJECTED");

  const handleStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    await updateRefundStatusFn({ data: { id, status } });
    router.invalidate();
  };

  const statusTone = (status: string) =>
    status === "APPROVED"
      ? "border-neon-lime/40 bg-neon-lime/10 text-neon-lime"
      : status === "REJECTED"
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-neon-amber/40 bg-neon-amber/10 text-neon-amber";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Refund Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage student refund claims.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Pending
          </p>
          <p className="font-display text-2xl font-bold text-neon-amber">{pending.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Approved
          </p>
          <p className="font-display text-2xl font-bold text-neon-lime">{approved.length}</p>
        </Panel>
        <Panel>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Rejected
          </p>
          <p className="font-display text-2xl font-bold text-red-400">{rejected.length}</p>
        </Panel>
      </div>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Pending Requests</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Reason</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Requested</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {refunds.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{r.user?.name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground max-w-md line-clamp-2">
                  {r.reason}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusTone(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-neon-lime/40 text-neon-lime hover:bg-neon-lime/10"
                      onClick={() => handleStatus(r.id, "APPROVED")}
                      disabled={r.status !== "PENDING"}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-red-500/40 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleStatus(r.id, "REJECTED")}
                      disabled={r.status !== "PENDING"}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {refunds.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No refund requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
