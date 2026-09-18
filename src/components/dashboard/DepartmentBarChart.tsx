'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { CategoryCount } from '@/lib/analytics/calculations';

interface DepartmentBarChartProps {
  data: CategoryCount[];
  title?: string;
  subtitle?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryCount;
  }>;
}

function CustomDeptTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl p-3 text-xs text-white min-w-44">
        <p className="font-bold text-slate-200 text-xs mb-1">
          {item.name}
        </p>
        <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Total Separations:</span>
            <span className="font-mono font-bold text-blue-400 tabular-nums">
              {item.count} ({item.percentage}%)
            </span>
          </div>
          {item.averageTenureYears !== undefined && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Avg. Tenure:</span>
              <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                {item.averageTenureYears} yrs
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function DepartmentBarChart({
  data,
  title = 'Department-wise Exit Volume',
  subtitle = 'Recorded separations by organizational function',
}: DepartmentBarChartProps) {
  const chartData = data.slice(0, 7);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No department exit records available.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
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
              tickFormatter={(val: string) => (val.length > 20 ? `${val.slice(0, 19)}…` : val)}
            />
            <Tooltip content={<CustomDeptTooltip />} />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
