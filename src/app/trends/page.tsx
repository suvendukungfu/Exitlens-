'use client';

import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import {
  calculateMonthlyTrend,
  calculateQuarterlyTrend,
} from '@/lib/analytics/calculations';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color: string;
  }>;
  label?: string;
}

function TrendsCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-45">
      <p className="text-xs font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1.5">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={`tt-${idx}`} className="flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
            </div>
            <span className="font-semibold text-white font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const { filteredRecords } = useExitData();
  const [aggregation, setAggregation] = useState<'monthly' | 'quarterly'>('monthly');

  // Aggregated data
  const monthlyData = useMemo(() => calculateMonthlyTrend(filteredRecords), [filteredRecords]);
  const quarterlyData = useMemo(() => calculateQuarterlyTrend(filteredRecords), [filteredRecords]);

  // Plant comparison trend data
  const plantMonthlyComparison = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const plants = ['Dappar (Punjab)', 'Jamshedpur (Jharkhand)', 'Chennai (Tamil Nadu)', 'Mehsana (Gujarat)', 'Saraikela (Jharkhand)'];

    filteredRecords.forEach((r) => {
      const dStr = r.lastWorkingDate || r.resignationDate;
      if (!dStr) return;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!map[mKey]) {
        map[mKey] = {};
        plants.forEach((p) => (map[mKey][p] = 0));
      }

      if (plants.includes(r.plant)) {
        map[mKey][r.plant] = (map[mKey][r.plant] || 0) + 1;
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.keys(map)
      .sort()
      .map((k) => {
        const [year, mStr] = k.split('-');
        const mIdx = parseInt(mStr, 10) - 1;
        return {
          month: k,
          label: `${monthNames[mIdx]} ${year}`,
          ...map[k],
        };
      });
  }, [filteredRecords]);

  const activeTrendData = aggregation === 'monthly' ? monthlyData : quarterlyData;

  return (
    <div className="pb-12">
      <TopHeader
        title="Exit Trends Over Time"
        subtitle="Chronological exit dynamics, seasonal peaks, and longitudinal plant comparisons."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Aggregation Switcher Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xl">
          <div>
            <span className="text-xs font-semibold text-white block">
              Temporal Aggregation Granularity
            </span>
            <p className="text-[11px] text-slate-400">
              Toggle between monthly intervals and quarterly roll-ups for strategic executive review.
            </p>
          </div>

          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg text-xs border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setAggregation('monthly')}
              className={`px-3.5 py-1.5 rounded-md transition-all font-medium ${
                aggregation === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Series
            </button>
            <button
              onClick={() => setAggregation('quarterly')}
              className={`px-3.5 py-1.5 rounded-md transition-all font-medium ${
                aggregation === 'quarterly'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarterly Rollup
            </button>
          </div>
        </div>

        {/* Chart 1: Voluntary vs Involuntary Separation Trend */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white">
              Voluntary Resignations vs Involuntary Terminations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking resignation spikes vs contractual completions or retirements over time
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeTrendData as Array<{ label: string; count: number; voluntary: number; involuntary: number }>}
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendsCustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Bar dataKey="voluntary" name="Voluntary Resignation" fill="#3b82f6" stackId="t" radius={[0, 0, 0, 0]} />
                <Bar dataKey="involuntary" name="Involuntary / Other" fill="#64748b" stackId="t" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Plant Comparison Multi-Series Trend */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white">
              Multi-Plant Monthly Exit Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing exit volume trajectories across Steel Strips Wheels manufacturing units
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plantMonthlyComparison} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendsCustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Line type="monotone" dataKey="Dappar (Punjab)" name="Dappar" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3.5, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Jamshedpur (Jharkhand)" name="Jamshedpur" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 3.5, fill: '#14b8a6' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Chennai (Tamil Nadu)" name="Chennai" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3.5, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Mehsana (Gujarat)" name="Mehsana" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3.5, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Saraikela (Jharkhand)" name="Saraikela" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3.5, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Methodology & Analytical Safeguards Notice */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3 backdrop-blur-sm">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">
              Methodological Note on Trend Interpretation
            </span>
            <p className="leading-relaxed">
              Trend fluctuations reflect recorded exit volumes for dates documented in company registers. Correlation with seasonal events (e.g. post-appraisal months in Q1/Q2 or agricultural sowing seasons) does not imply direct causality without local plant HR exit interview corroboration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
