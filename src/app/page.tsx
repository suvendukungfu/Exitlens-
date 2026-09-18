'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  UserMinus,
  Clock,
  HelpCircle,
  Percent,
  ArrowRight,
  TrendingUp,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { ReasonsBarChart } from '@/components/dashboard/ReasonsBarChart';
import { DepartmentBarChart } from '@/components/dashboard/DepartmentBarChart';
import { PlantBarChart } from '@/components/dashboard/PlantBarChart';
import { ReasonDepartmentHeatmap } from '@/components/dashboard/ReasonDepartmentHeatmap';
import { TenureHistogram } from '@/components/dashboard/TenureHistogram';
import { ExitTypeDonut } from '@/components/dashboard/ExitTypeDonut';
import { ReasonCompositionChart } from '@/components/dashboard/ReasonCompositionChart';
import {
  calculateOverviewMetrics,
  calculateMonthlyTrend,
  calculateReasonDistribution,
  calculateDepartmentExits,
  calculatePlantExits,
  calculateTenureBuckets,
  calculateExitTypes,
  calculateReasonByDepartmentMatrix,
  calculateMonthlyReasonComposition,
  generateCalculatedObservations,
} from '@/lib/analytics/calculations';

export default function OverviewPage() {
  const { filteredRecords, records, isDemoData, headcounts, dataQualityScore } = useExitData();

  // Metrics
  const metrics = useMemo(
    () => calculateOverviewMetrics(filteredRecords, headcounts),
    [filteredRecords, headcounts]
  );

  // Charts data
  const monthlyTrend = useMemo(() => calculateMonthlyTrend(filteredRecords), [filteredRecords]);
  const reasonDist = useMemo(() => calculateReasonDistribution(filteredRecords), [filteredRecords]);
  const deptDist = useMemo(() => calculateDepartmentExits(filteredRecords), [filteredRecords]);
  const plantDist = useMemo(() => calculatePlantExits(filteredRecords), [filteredRecords]);
  const tenureBuckets = useMemo(() => calculateTenureBuckets(filteredRecords), [filteredRecords]);
  const exitTypes = useMemo(() => calculateExitTypes(filteredRecords), [filteredRecords]);
  const reasonDeptMatrix = useMemo(
    () => calculateReasonByDepartmentMatrix(filteredRecords),
    [filteredRecords]
  );
  const reasonComposition = useMemo(
    () => calculateMonthlyReasonComposition(filteredRecords),
    [filteredRecords]
  );

  // Strictly calculated observations
  const observations = useMemo(
    () => generateCalculatedObservations(filteredRecords),
    [filteredRecords]
  );

  return (
    <div className="pb-16">
      {/* Top Header */}
      <TopHeader
        title="Employee Exit Intelligence"
        subtitle="Steel Strips Wheels — Enterprise departure analytics and retention diagnostics."
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4.5">
          <KpiCard
            label="Total Recorded Exits"
            value={metrics.totalExits}
            subtitle="Current filtered period"
            icon={UserMinus}
            badge={isDemoData ? 'Demo Set' : 'Verified'}
            badgeType={isDemoData ? 'warning' : 'success'}
            helperText={`${records.length - filteredRecords.length} filtered out`}
          />

          <KpiCard
            label="Voluntary Resignations"
            value={`${metrics.voluntaryPercentage}%`}
            subtitle={`${metrics.voluntaryExits} of ${metrics.totalExits} separations`}
            icon={TrendingUp}
            badge={`${metrics.involuntaryExits} Involuntary`}
            badgeType="info"
            helperText="Employee-initiated departures"
          />

          <KpiCard
            label="Average Tenure at Exit"
            value={`${metrics.averageTenureYears} yrs`}
            subtitle={`Median: ${metrics.medianTenureYears} years`}
            icon={Clock}
            badgeType="neutral"
            helperText="Joining date to last working date"
          />

          <KpiCard
            label="Leading Exit Reason"
            value={metrics.mostCommonReason.count > 0 ? metrics.mostCommonReason.count : '—'}
            subtitle={metrics.mostCommonReason.reason}
            icon={HelpCircle}
            badge={`${metrics.mostCommonReason.percentage}% of total`}
            badgeType="neutral"
            helperText="Primary recorded cause"
          />

          <KpiCard
            label="Annualized Attrition"
            value={metrics.attritionRate !== null ? `${metrics.attritionRate}%` : 'Headcount data required'}
            subtitle={metrics.attritionRate !== null ? 'Computed vs avg active headcount' : 'Configure in Settings'}
            icon={Percent}
            badge={metrics.attritionRate !== null ? 'Live Rate' : 'Headcount Required'}
            badgeType={metrics.attritionRate !== null ? 'success' : 'neutral'}
            helperText="Exits / Headcount × 100"
          />
        </div>

        {/* Charts Row 1: Monthly Trend & Exit Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyTrendChart data={monthlyTrend} />
          <ReasonsBarChart data={reasonDist} limit={7} />
        </div>

        {/* Charts Row 2: Department-wise Exits & Plant-wise Exits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DepartmentBarChart data={deptDist} />
          <PlantBarChart data={plantDist} />
        </div>

        {/* Charts Row 3: Heatmap Matrix (Exit Reason x Department) */}
        <ReasonDepartmentHeatmap matrix={reasonDeptMatrix} />

        {/* Charts Row 4: Tenure Buckets & Exit Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TenureHistogram data={tenureBuckets} />
          <ExitTypeDonut data={exitTypes} />
        </div>

        {/* Charts Row 5: Monthly Reason Composition */}
        <ReasonCompositionChart data={reasonComposition} />

        {/* Bottom Section: Analytical Observations & Data Quality Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Observations (strictly calculated) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Calculated Empirical Observations
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3.5">
              Observations derived strictly from current filtered dataset calculations without speculative assumptions:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              {observations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed font-medium text-slate-800">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Quality Health & Quick Links */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Data Health Score
                  </h3>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                  {dataQualityScore}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Completeness of mandatory employee fields across active records.
              </p>

              <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${dataQualityScore}%` }}
                />
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Early Leavers (&lt;1 yr):</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {metrics.earlyExitCount} ({metrics.earlyExitPercentage}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Headcount Alignment:</span>
                  <span className={`font-semibold ${metrics.headcountAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {metrics.headcountAvailable ? 'Configured' : 'Headcount Required'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/quality"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-semibold transition-colors"
              >
                <span>Audit Quality</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/records"
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors font-medium"
              >
                <span>Browse Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
