import { createFileRoute } from "@tanstack/react-router";
import { getAdminPaymentsFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { RevenueChart, type PeriodType } from "@/components/admin/RevenueChart";
import {
  Coins,
  CheckCircle2,
  Circle,
  XCircle,
  TrendingUp,
  type LucideIcon,
  Search,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/reports")({
  loader: async () => {
    return await getAdminPaymentsFn();
  },
  head: () => ({
    meta: [{ title: "Financial Reports & Revenue — Control Hub" }],
  }),
  component: AdminReports,
});

function AdminReports() {
  const data = Route.useLoaderData();

  const [currentPeriod, setCurrentPeriod] = useState<PeriodType>(
    (data.period as PeriodType) || "6m"
  );
  const [chartData, setChartData] = useState(data.chartData || []);
  const [periodRevenue, setPeriodRevenue] = useState(data.periodRevenue || 0);
  const [totalRevenue, setTotalRevenue] = useState(data.totalRevenue || 0);
  const [availableYears, setAvailableYears] = useState(data.availableYears || []);
  const [selectedYear, setSelectedYear] = useState(data.selectedYear || new Date().getFullYear());
  const [paidCount, setPaidCount] = useState(data.paidCount || 0);
  const [pendingCount, setPendingCount] = useState(data.pendingCount || 0);
  const [failedCount, setFailedCount] = useState(data.failedCount || 0);
  const [payments, setPayments] = useState(data.payments || []);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Table filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handleFilterChange = async (filters: {
    period: PeriodType;
    selectedYear?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    setIsLoadingChart(true);
    try {
      const res = await getAdminPaymentsFn({ data: filters });
      setCurrentPeriod(filters.period);
      setChartData(res.chartData || []);
      setPeriodRevenue(res.periodRevenue || 0);
      setTotalRevenue(res.totalRevenue || 0);
      if (res.availableYears) setAvailableYears(res.availableYears);
      if (res.selectedYear) setSelectedYear(res.selectedYear);
      setPaidCount(res.paidCount || 0);
      setPendingCount(res.pendingCount || 0);
      setFailedCount(res.failedCount || 0);
      setPayments(res.payments || []);
    } catch (err) {
      console.error("Failed to load period payments:", err);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const statusTone = (status: string) =>
    status === "PAID"
      ? "border-neon-lime/40 bg-neon-lime/10 text-neon-lime"
      : status === "FAILED"
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-neon-amber/40 bg-neon-amber/10 text-neon-amber";

  const card = (
    label: string,
    value: string | number,
    accent: string,
    Icon: LucideIcon
  ) => (
    <Panel className="flex items-center gap-4">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-surface-2 ${accent}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className={`font-display text-2xl font-bold ${accent.split(" ")[0]}`}>
          {value}
        </p>
      </div>
    </Panel>
  );

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesSearch =
      !search ||
      (p.user?.name && p.user.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.user?.email && p.user.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.razorpayOrderId &&
        p.razorpayOrderId.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Financial Analytics & Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time payment analytics, time-filtered revenue projections, and transaction ledger.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {card(
          "Lifetime Revenue",
          `₹${totalRevenue.toLocaleString("en-IN")}`,
          "text-neon-amber border-neon-amber/50",
          Coins
        )}
        {card(
          "Paid Transactions",
          paidCount,
          "text-neon-lime border-neon-lime/50",
          CheckCircle2
        )}
        {card(
          "Pending Verification",
          pendingCount,
          "text-neon-cyan border-neon-cyan/50",
          Circle
        )}
        {card(
          "Failed Transactions",
          failedCount,
          "text-red-500 border-red-500/50",
          XCircle
        )}
      </div>

      {/* Interactive Time Horizon Revenue Graph with Curve / Bar switcher, Year Picker, and Calendar Range */}
      <RevenueChart
        initialPeriod={currentPeriod}
        chartData={chartData}
        totalRevenue={totalRevenue}
        periodRevenue={periodRevenue}
        availableYears={availableYears}
        selectedYear={selectedYear}
        onFilterChange={handleFilterChange}
        isLoading={isLoadingChart}
      />

      {/* Transaction Log Table */}
      <Panel className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <PanelTitle>Transaction Ledger ({filteredPayments.length})</PanelTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user, email, or order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-surface-2/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">
                      {p.user?.name ?? "Unknown Hunter"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {p.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground font-mono">
                      {p.razorpayOrderId}
                    </code>
                  </td>
                  <td className="px-6 py-4 font-display font-bold text-neon-amber glow-text">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(
                        p.status
                      )}`}
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
              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No transactions found for the selected filters.
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
