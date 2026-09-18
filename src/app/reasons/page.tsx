'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
} from 'lucide-react';
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
import {
  calculateReasonDistribution,
  calculateMonthlyReasonComposition,
} from '@/lib/analytics/calculations';
import { ReasonsBarChart } from '@/components/dashboard/ReasonsBarChart';
import { ReasonCompositionChart } from '@/components/dashboard/ReasonCompositionChart';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    payload?: { percentage?: number; count?: number };
  }>;
  label?: string;
}

function ReasonCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const pct = entry.payload?.percentage;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-3 text-xs text-slate-800 min-w-42.5">
      <p className="text-xs font-bold text-slate-900 mb-1.5 border-b border-slate-100 pb-1">{label || entry.name}</p>
      <div className="flex items-center justify-between text-xs gap-3">
        <span className="text-slate-500">Recorded Exits:</span>
        <span className="font-semibold text-slate-900 font-mono">{entry.value}</span>
      </div>
      {pct !== undefined && (
        <div className="flex items-center justify-between text-xs gap-3 mt-1">
          <span className="text-slate-500">Share:</span>
          <span className="font-medium text-teal-600 font-mono">{pct}%</span>
        </div>
      )}
    </div>
  );
}

export default function ReasonsPage() {
  const { filteredRecords } = useExitData();
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');

  const primaryReasons = useMemo(
    () => calculateReasonDistribution(filteredRecords),
    [filteredRecords]
  );

  // Secondary reasons breakdown
  const secondaryReasons = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const sec = r.secondaryReason || 'Unspecified / Confidential';
      counts[sec] = (counts[sec] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          filteredRecords.length > 0
            ? Number(((count / filteredRecords.length) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  // Monthly reason composition
  const monthlyComposition = useMemo(
    () => calculateMonthlyReasonComposition(filteredRecords),
    [filteredRecords]
  );

  // Filtered verbatim reason records for table drill-down
  const verbatimRecords = useMemo(() => {
    return filteredRecords.filter((r) => {
      if (selectedReasonFilter !== 'ALL' && r.primaryReason !== selectedReasonFilter) {
        return false;
      }
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const matchEmp = r.employeeId.toLowerCase().includes(q);
        const matchDetail = r.detailedReason?.toLowerCase().includes(q);
        const matchRemarks = r.hrRemarks?.toLowerCase().includes(q);
        const matchDept = r.department.toLowerCase().includes(q);
        if (!matchEmp && !matchDetail && !matchRemarks && !matchDept) return false;
      }
      return true;
    });
  }, [filteredRecords, selectedReasonFilter, tableSearch]);

  return (
    <div className="pb-12">
      <TopHeader
        title="Exit Reasons & Root Cause Intelligence"
        subtitle="Cataloging primary departure categories, secondary catalysts, and preserving detailed interview feedback."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Charts Row 1: Primary Reasons & Secondary Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReasonsBarChart
            data={primaryReasons}
            limit={10}
            title="Primary Exit Reasons Breakdown"
            subtitle="Rank-ordered distribution across all 15 standardized taxonomy categories"
          />

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Secondary Contributing Drivers
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Specific contextual catalysts cited during HR exit discussions
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={secondaryReasons.slice(0, 8)}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
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
                  <Tooltip content={<ReasonCustomTooltip />} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Reason Composition Over Time */}
        <ReasonCompositionChart data={monthlyComposition} />

        {/* Verbatim Exit Records & Comments Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span>Verbatim Exit Comments & Details Register</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Preserving original employee feedback notes alongside standardized categorization
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <select
                value={selectedReasonFilter}
                onChange={(e) => setSelectedReasonFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              >
                <option value="ALL">All Categories ({filteredRecords.length})</option>
                {primaryReasons.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.count})
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search comments..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="p-3.5 font-semibold w-28">Emp ID</th>
                  <th className="p-3.5 font-semibold w-44">Primary Reason</th>
                  <th className="p-3.5 font-semibold w-40">Secondary Driver</th>
                  <th className="p-3.5 font-semibold">Employee Detailed Feedback</th>
                  <th className="p-3.5 font-semibold w-36">Department</th>
                  <th className="p-3.5 font-semibold w-32">Plant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verbatimRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No verbatim exit records match the selected category and search term.
                    </td>
                  </tr>
                ) : (
                  verbatimRecords.slice(0, 15).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-blue-600">
                        {rec.employeeId}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {rec.primaryReason}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {rec.secondaryReason || '—'}
                      </td>
                      <td className="p-3.5 text-slate-700 italic font-sans leading-relaxed">
                        &ldquo;{rec.detailedReason || 'No detailed remarks recorded'}&rdquo;
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {rec.department}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {rec.plant.split(' ')[0]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>Displaying up to 15 verbatim entries matching criteria</span>
            <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Confidential HR Records</span>
          </div>
        </div>
      </div>
    </div>
  );
}
