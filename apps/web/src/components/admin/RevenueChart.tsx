import React, { useState } from "react";
import { Panel } from "@/components/site/ui-bits";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type PeriodType =
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "12m"
  | "year"
  | "custom"
  | "all";

export interface ChartDataPoint {
  label: string;
  amount: number;
  orders: number;
  dateKey?: string;
}

interface RevenueChartProps {
  initialPeriod?: PeriodType;
  chartData: ChartDataPoint[];
  totalRevenue: number;
  periodRevenue: number;
  availableYears?: number[];
  selectedYear?: number;
  onFilterChange?: (filters: {
    period: PeriodType;
    selectedYear?: number;
    startDate?: string;
    endDate?: string;
  }) => void;
  isLoading?: boolean;
}

export function RevenueChart({
  initialPeriod = "6m",
  chartData = [],
  totalRevenue,
  periodRevenue,
  availableYears = [new Date().getFullYear()],
  selectedYear = new Date().getFullYear(),
  onFilterChange,
  isLoading = false,
}: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(initialPeriod);
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [activeYear, setActiveYear] = useState<number>(selectedYear);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Custom Calendar state
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const periods: { key: PeriodType; label: string }[] = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "3m", label: "3 Months" },
    { key: "6m", label: "6 Months" },
    { key: "12m", label: "12 Months" },
    { key: "year", label: `Year (${activeYear})` },
    { key: "all", label: "All Time" },
  ];

  const handleSelectPeriod = (p: PeriodType) => {
    setSelectedPeriod(p);
    setShowCustomPicker(false);
    if (onFilterChange) {
      onFilterChange({
        period: p,
        selectedYear: activeYear,
      });
    }
  };

  const handleYearChange = (year: number) => {
    setActiveYear(year);
    setSelectedPeriod("year");
    setShowCustomPicker(false);
    if (onFilterChange) {
      onFilterChange({
        period: "year",
        selectedYear: year,
      });
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSelectedPeriod("custom");
    if (onFilterChange) {
      onFilterChange({
        period: "custom",
        startDate,
        endDate,
      });
    }
  };

  // Calculations for graph geometry
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 500);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue =
    totalOrders > 0 ? Math.round(periodRevenue / totalOrders) : 0;

  // Generate SVG Points for Smooth Curved Area Line Chart
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  const points = chartData.map((d, i) => {
    const x =
      chartData.length <= 1
        ? svgWidth / 2
        : paddingX + (i / (chartData.length - 1)) * innerWidth;
    const y =
      svgHeight -
      paddingY -
      (maxAmount > 0 ? (d.amount / maxAmount) * innerHeight : 0);
    return { x, y, data: d, index: i };
  });

  // Bezier curve path string
  const createCurvedPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = createCurvedPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
      : "";

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <Panel accent="amber" className="space-y-6 animate-in fade-in duration-300">
      {/* Chart Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-amber/15 border border-neon-amber/40 text-neon-amber shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              Financial Revenue & Trend Analytics
            </h3>
            <p className="text-xs text-muted-foreground">
              Dynamic financial projections, year-by-year analysis, and custom calendar ranges
            </p>
          </div>
        </div>

        {/* View Mode & Year Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Style Toggle (Area Curve vs Bar Graph) */}
          <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5">
            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === "area"
                  ? "bg-neon-amber text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Smooth Area Curve Chart"
            >
              <LineChartIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === "bar"
                  ? "bg-neon-amber text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={activeYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="appearance-none rounded-lg border border-neon-amber/40 bg-surface-2 pl-3 pr-8 py-1.5 text-xs font-semibold text-neon-amber focus:outline-none focus:border-neon-amber cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-surface text-foreground">
                  Year: {yr}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-neon-amber" />
          </div>

          {/* Custom Date Range Toggle */}
          <Button
            variant={selectedPeriod === "custom" || showCustomPicker ? "neon" : "outline"}
            size="sm"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="text-xs h-8 px-3 border-border"
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Preset Horizon Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => handleSelectPeriod(p.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedPeriod === p.key && !showCustomPicker
                  ? "bg-neon-amber text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Selected Horizon Info */}
        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-neon-amber" /> Active Filter:{" "}
          <strong className="text-neon-amber uppercase">
            {selectedPeriod === "year"
              ? `Full Year ${activeYear}`
              : selectedPeriod === "custom"
                ? `${startDate} → ${endDate}`
                : selectedPeriod}
          </strong>
        </span>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomPicker && (
        <form
          onSubmit={handleApplyCustomRange}
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-neon-amber/30 bg-surface-2 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From:</span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">To:</span>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-neon-amber focus:outline-none"
            />
          </div>

          <Button type="submit" variant="neon" size="sm" className="text-xs h-8">
            Apply Date Range
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomPicker(false)}
            className="text-xs h-8 text-muted-foreground"
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/70 bg-background/40 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-neon-amber/5 rounded-full blur-xl" />
          <p className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
            Selected Horizon Revenue
          </p>
          <p className="font-display text-2xl font-bold text-neon-amber glow-text mt-1">
            ₹{periodRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/40 p-4">
          <p className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
            Paid Transactions
          </p>
          <p className="font-display text-2xl font-bold text-neon-lime mt-1">
            {totalOrders}{" "}
            <span className="text-xs font-sans text-muted-foreground font-normal">
              orders
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/40 p-4">
          <p className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
            Avg. Transaction Value
          </p>
          <p className="font-display text-2xl font-bold text-neon-cyan mt-1">
            ₹{avgOrderValue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="relative pt-4 pb-2">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <span className="animate-pulse">Loading revenue metrics...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 opacity-30 mb-2" />
            <p>No transaction revenue recorded for this time range.</p>
          </div>
        ) : chartType === "area" ? (
          /* Smooth Glowing Area Line Chart */
          <div className="relative w-full">
            {/* Tooltip Overlay */}
            {activePoint && (
              <div className="mb-2 p-3 rounded-lg border border-neon-amber/60 bg-surface-2/95 shadow-xl text-xs flex items-center justify-between gap-4 max-w-xs mx-auto animate-in fade-in duration-150">
                <span className="font-semibold text-foreground">
                  {activePoint.data.label}
                </span>
                <span className="font-display font-bold text-neon-amber text-sm">
                  ₹{activePoint.data.amount.toLocaleString("en-IN")}
                </span>
                <span className="text-muted-foreground">
                  ({activePoint.data.orders} orders)
                </span>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-64 overflow-visible"
              >
                <defs>
                  {/* Glowing Amber/Gold Gradient */}
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>

                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Y-Axis Reference Grid Lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                  const y = svgHeight - paddingY - ratio * innerHeight;
                  const val = Math.round(ratio * maxAmount);
                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        className="text-border/40"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] fill-muted-foreground font-mono"
                      >
                        ₹{val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                      </text>
                    </g>
                  );
                })}

                {/* Baseline */}
                <line
                  x1={paddingX}
                  y1={svgHeight - paddingY}
                  x2={svgWidth - paddingX}
                  y2={svgHeight - paddingY}
                  stroke="currentColor"
                  className="text-border"
                />

                {/* Area Gradient Fill */}
                {areaPath && (
                  <path d={areaPath} fill="url(#areaGradient)" />
                )}

                {/* Main Glowing Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                )}

                {/* Interactive Points */}
                {points.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Hover hotspot */}
                    <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                    {/* Outer pulse ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIdx === idx ? 8 : 4}
                      fill="#f59e0b"
                      fillOpacity={hoveredIdx === idx ? 0.35 : 0.15}
                      className="transition-all duration-200"
                    />

                    {/* Point Core */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIdx === idx ? 5 : 3.5}
                      fill="#fef08a"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    {/* X-Axis Label */}
                    <text
                      x={pt.x}
                      y={svgHeight - paddingY + 18}
                      textAnchor="middle"
                      className={`text-[10px] font-mono transition-colors ${
                        hoveredIdx === idx
                          ? "fill-neon-amber font-bold"
                          : "fill-muted-foreground"
                      }`}
                    >
                      {pt.data.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          /* Cyberpunk Bar Chart Mode */
          <div className="space-y-4">
            {hoveredIdx !== null && chartData[hoveredIdx] && (
              <div className="p-3 rounded-lg border border-neon-amber/60 bg-surface-2/95 shadow-xl text-xs flex items-center justify-between gap-4 max-w-xs mx-auto animate-in fade-in duration-150">
                <span className="font-semibold text-foreground">
                  {chartData[hoveredIdx].label}
                </span>
                <span className="font-display font-bold text-neon-amber text-sm">
                  ₹{chartData[hoveredIdx].amount.toLocaleString("en-IN")}
                </span>
                <span className="text-muted-foreground">
                  ({chartData[hoveredIdx].orders} orders)
                </span>
              </div>
            )}

            <div className="h-56 w-full flex items-end gap-2 sm:gap-4 px-2 pt-6 border-b border-border/80">
              {chartData.map((d, idx) => {
                const heightPct = Math.max(
                  Math.round((d.amount / maxAmount) * 100),
                  d.amount > 0 ? 8 : 2
                );

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-neon-amber mb-1 truncate">
                      ₹{d.amount >= 1000 ? `${Math.round(d.amount / 1000)}k` : d.amount}
                    </div>

                    <div className="w-full max-w-[48px] bg-surface-2 rounded-t-lg overflow-hidden h-full flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 ${
                          d.amount > 0
                            ? "bg-gradient-to-t from-neon-amber/40 via-neon-amber to-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                            : "bg-border/30"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono mt-2 truncate max-w-[50px] text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
