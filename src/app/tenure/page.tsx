'use client';

import React, { useMemo } from 'react';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TenureHistogram } from '@/components/dashboard/TenureHistogram';
import {
  calculateTenureBuckets,
  calculateOverviewMetrics,
  calculateDepartmentExits,
  calculatePlantExits,
} from '@/lib/analytics/calculations';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
  }>;
  label?: string;
}

function TenureCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-3 text-xs text-slate-800 min-w-42.5">
      <p className="text-xs font-bold text-slate-900 mb-1.5 border-b border-slate-100 pb-1">{label || entry.name}</p>
      <div className="flex items-center justify-between text-xs gap-3">
        <span className="text-slate-500">Avg Tenure:</span>
        <span className="font-semibold text-slate-900 font-mono">{entry.value} yrs</span>
      </div>
    </div>
  );
}

export default function TenurePage() {
  const { filteredRecords } = useExitData();

  const metrics = useMemo(() => calculateOverviewMetrics(filteredRecords), [filteredRecords]);
  const tenureBuckets = useMemo(() => calculateTenureBuckets(filteredRecords), [filteredRecords]);
  const deptDist = useMemo(() => calculateDepartmentExits(filteredRecords), [filteredRecords]);
  const plantDist = useMemo(() => calculatePlantExits(filteredRecords), [filteredRecords]);

  // Early exits calculations
  const underThreeMonths = tenureBuckets.find((b) => b.bucket === '0–3 months')?.count || 0;
  const threeToSixMonths = tenureBuckets.find((b) => b.bucket === '3–6 months')?.count || 0;
  const underSixMonths = underThreeMonths + threeToSixMonths;
  const underSixMonthsPct =
    filteredRecords.length > 0
      ? Number(((underSixMonths / filteredRecords.length) * 100).toFixed(1))
      : 0;

  const underOneYear = metrics.earlyExitCount;
  const underOneYearPct = metrics.earlyExitPercentage;

  return (
    <div className="pb-12">
      <TopHeader
        title="Tenure & Early Exit Dynamics"
        subtitle="Evaluating service duration at departure, onboarding retention vulnerabilities, and veteran attrition."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Average Tenure at Departure"
            value={`${metrics.averageTenureYears} yrs`}
            subtitle="Arithmetic mean service length"
            icon={Clock}
            badge="Mean"
            badgeType="info"
            helperText="Joining Date to Last Working Date"
          />

          <KpiCard
            label="Median Service Duration"
            value={`${metrics.medianTenureYears} yrs`}
            subtitle="50th percentile service midpoint"
            icon={Clock}
            badge="Robust Median"
            badgeType="neutral"
            helperText="Resistant to extreme outlier tenures"
          />

          <KpiCard
            label="Early Attrition (< 6 Months)"
            value={`${underSixMonthsPct}%`}
            subtitle={`${underSixMonths} employees departed in 180 days`}
            icon={AlertTriangle}
            badge="Probation Risk"
            badgeType={underSixMonthsPct > 15 ? 'warning' : 'neutral'}
            helperText="Onboarding & initial adaptation phase"
          />

          <KpiCard
            label="First-Year Turnover (< 12 Months)"
            value={`${underOneYearPct}%`}
            subtitle={`${underOneYear} departures in year 1`}
            icon={AlertTriangle}
            badge="Ramp-up Phase"
            badgeType={underOneYearPct > 30 ? 'warning' : 'info'}
            helperText="Training ROI loss indicator"
          />
        </div>

        {/* Chart 1: Tenure Buckets Histogram */}
        <TenureHistogram data={tenureBuckets} />

        {/* Charts Row 2: Tenure by Department & Tenure by Plant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Tenure by Department */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Average Tenure at Exit by Department
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Comparing average service length across operational divisions
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={deptDist.slice(0, 6)}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" yrs"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    width={140}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
                  />
                  <Tooltip content={<TenureCustomTooltip />} />
                  <Bar dataKey="averageTenureYears" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Tenure by Plant */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Average Tenure at Exit by Plant
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Tenure differences across Steel Strips Wheels operating locations
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={plantDist}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" yrs"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    width={140}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<TenureCustomTooltip />} />
                  <Bar dataKey="averageTenureYears" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Business Rule & Calculation Methodology Documentation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Standardized Tenure Methodology & Business Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-900 block mb-1.5">
                1. Effective Calculation Interval
              </span>
              <p className="text-slate-600 leading-relaxed">
                Calculated strictly from <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">Joining Date</code> to <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">Last Working Date</code>. If Last Working Date is unrecorded, the <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">Resignation Date</code> is utilized as the operational end marker.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-900 block mb-1.5">
                2. Discretionary Precision Rule
              </span>
              <p className="text-slate-600 leading-relaxed">
                Values are displayed rounded to a single decimal (e.g. <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">2.8 years</code>) to reflect practical human resource decision-making and prevent misleading false precision.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <span className="font-bold text-slate-900 block mb-1.5">
                3. Early Career Risk Thresholds
              </span>
              <p className="text-slate-600 leading-relaxed">
                Departures occurring before 180 days (&lt;6 months) are marked as onboarding risk indicators. Departures between 1 and 2 years represent skilled transition turnover.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
