'use client';

import React, { useState, useMemo } from 'react';
import { Building2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import {
  calculateDepartmentExits,
  calculateMonthlyTrend,
  calculateReasonDistribution,
} from '@/lib/analytics/calculations';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    payload?: { percentage?: number; count?: number };
    color?: string;
  }>;
  label?: string;
}

function DeptCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const pct = entry.payload?.percentage;
  return (
    <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xl p-3 text-xs text-slate-800 dark:text-slate-100 min-w-42.5">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">{label || entry.name}</p>
      <div className="flex items-center justify-between text-xs gap-3">
        <span className="text-slate-500 dark:text-slate-400">Recorded Exits:</span>
        <span className="font-semibold text-slate-900 dark:text-white font-mono">{entry.value}</span>
      </div>
      {pct !== undefined && (
        <div className="flex items-center justify-between text-xs gap-3 mt-1">
          <span className="text-slate-500 dark:text-slate-400">Share:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400 font-mono">{pct}%</span>
        </div>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const { filteredRecords } = useExitData();
  const [selectedDept, setSelectedDept] = useState<string>('Production / Shop Floor');

  const deptCounts = useMemo(() => calculateDepartmentExits(filteredRecords), [filteredRecords]);

  // Specific records for the selected department
  const selectedDeptRecords = useMemo(
    () => filteredRecords.filter((r) => r.department === selectedDept),
    [filteredRecords, selectedDept]
  );

  // Sub-department breakdown for the selected department
  const subDeptData = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedDeptRecords.forEach((r) => {
      const sub = r.subDepartment || 'General / Unassigned';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          selectedDeptRecords.length > 0
            ? Number(((count / selectedDeptRecords.length) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [selectedDeptRecords]);

  // Reasons breakdown for selected department
  const deptReasons = useMemo(
    () => calculateReasonDistribution(selectedDeptRecords).slice(0, 6),
    [selectedDeptRecords]
  );

  // Monthly trend for selected department
  const deptMonthlyTrend = useMemo(
    () => calculateMonthlyTrend(selectedDeptRecords),
    [selectedDeptRecords]
  );

  return (
    <div className="pb-12">
      <TopHeader
        title="Department & Sub-Department Analytics"
        subtitle="Evaluating exit density, service length, and primary departure drivers by organizational function."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Department Overview Table & Summary */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Departmental Exit Distribution & Service Duration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparative volume, share of organization departures, and average service length
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5 font-semibold">Department</th>
                  <th className="p-3.5 font-semibold text-center">Recorded Exits</th>
                  <th className="p-3.5 font-semibold text-center">Share of Exits</th>
                  <th className="p-3.5 font-semibold text-center">Voluntary Count</th>
                  <th className="p-3.5 font-semibold text-center">Avg Service Length</th>
                  <th className="p-3.5 font-semibold text-right">Deep Dive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {deptCounts.map((d, index) => (
                  <tr
                    key={d.name}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      selectedDept === d.name ? 'bg-blue-50/70 dark:bg-blue-600/10 font-medium border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>{d.name}</span>
                      {index === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">
                          Highest Recorded Count
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white font-mono">
                      {d.count}
                    </td>
                    <td className="p-3.5 text-center text-slate-600 dark:text-slate-400 font-mono">
                      {d.percentage}%
                    </td>
                    <td className="p-3.5 text-center text-slate-600 dark:text-slate-400 font-mono">
                      {d.voluntaryCount}
                    </td>
                    <td className="p-3.5 text-center text-slate-700 dark:text-slate-300 font-mono">
                      {d.averageTenureYears} yrs
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedDept(d.name)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                          selectedDept === d.name
                            ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-500'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Department Drill-down Header */}
        <div className="flex items-center justify-between bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 p-4.5 rounded-2xl shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Isolated Department Focus:
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">
              {selectedDept}
            </span>
          </div>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
            {selectedDeptRecords.length} exits in selection
          </span>
        </div>

        {/* Charts Row: Sub-department & Department Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sub-department breakdown */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Sub-Department Volume Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Operational work center allocations within {selectedDept}
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={subDeptData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
                  />
                  <Tooltip content={<DeptCustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Reasons breakdown */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Primary Exit Reasons in {selectedDept}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Leading reported drivers for staff departing this specific function
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={deptReasons}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
                  />
                  <Tooltip content={<DeptCustomTooltip />} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Selected Department Monthly Trend */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Monthly Exit Trajectory for {selectedDept}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Longitudinal departures for this functional group over active timeline
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deptMonthlyTrend} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.8} className="dark:stroke-slate-800" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.6 }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<DeptCustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Exits" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3.5, fill: '#3b82f6', strokeWidth: 1.5, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
