import { createFileRoute } from "@tanstack/react-router";
import { getAdminStatsFn } from "@/server/admin";
import { Panel } from "@/components/site/ui-bits";
import { RevenueChart, type PeriodType } from "@/components/admin/RevenueChart";
import {
  Users,
  BookOpen,
  GraduationCap,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/")({
  loader: async () => {
    return await getAdminStatsFn();
  },
  head: () => ({
    meta: [{ title: "System Overview — Control Hub" }],
  }),
  component: AdminDashboard,
});

function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent: "cyan" | "lime" | "purple" | "amber";
}) {
  const accentColors = {
    cyan: "text-neon-cyan border-neon-cyan/50",
    lime: "text-neon-lime border-neon-lime/50",
    purple: "text-neon-purple border-neon-purple/50",
    amber: "text-neon-amber border-neon-amber/50",
  };

  return (
    <Panel className="flex items-center gap-4">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-surface-2 ${accentColors[accent]}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <p className={`font-display text-2xl font-bold ${accentColors[accent].split(" ")[0]}`}>
          {value}
        </p>
      </div>
    </Panel>
  );
}

function AdminDashboard() {
  const stats = Route.useLoaderData();

  const [currentPeriod, setCurrentPeriod] = useState<PeriodType>(
    (stats.period as PeriodType) || "6m"
  );
  const [chartData, setChartData] = useState(stats.chartData || []);
  const [periodRevenue, setPeriodRevenue] = useState(stats.periodRevenue || 0);
  const [availableYears, setAvailableYears] = useState(stats.availableYears || []);
  const [selectedYear, setSelectedYear] = useState(stats.selectedYear || new Date().getFullYear());
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const handleFilterChange = async (filters: {
    period: PeriodType;
    selectedYear?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    setIsLoadingChart(true);
    try {
      const res = await getAdminStatsFn({ data: filters });
      setCurrentPeriod(filters.period);
      setChartData(res.chartData || []);
      setPeriodRevenue(res.periodRevenue || 0);
      if (res.availableYears) setAvailableYears(res.availableYears);
      if (res.selectedYear) setSelectedYear(res.selectedYear);
    } catch (err) {
      console.error("Failed to load revenue analytics:", err);
    } finally {
      setIsLoadingChart(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            System Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor academy metrics, student enrolments, and financial trends.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          stats.isSuperAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        <MetricCard
          title="Registered Hunters"
          value={stats.totalUsers}
          icon={Users}
          accent="cyan"
        />
        <MetricCard
          title="Active Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          accent="purple"
        />
        <MetricCard
          title="Total Enrollments"
          value={stats.totalEnrollments}
          icon={GraduationCap}
          accent="lime"
        />
        {/* Only Super Admin can see financial revenue */}
        {stats.isSuperAdmin && (
          <MetricCard
            title="Lifetime Revenue"
            value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            icon={Coins}
            accent="amber"
          />
        )}
      </div>

      {/* Super Admin Financial & Horizon Graph */}
      {stats.isSuperAdmin && (
        <div className="pt-2">
          <RevenueChart
            initialPeriod={currentPeriod}
            chartData={chartData}
            totalRevenue={stats.totalRevenue}
            periodRevenue={periodRevenue}
            availableYears={availableYears}
            selectedYear={selectedYear}
            onFilterChange={handleFilterChange}
            isLoading={isLoadingChart}
          />
        </div>
      )}
    </div>
  );
}
