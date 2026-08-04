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
            <div className="text-center py-12 text-muted-foreground">
              No purchases found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
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
                        {purchase.id.split('-')[0]}...
                      </td>
                      <td className="py-4">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 font-medium text-foreground">
                        {purchase.courseTitle}
                      </td>
                      <td className="py-4 text-right font-display text-neon-cyan">
                        ₹{purchase.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download Receipt">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
