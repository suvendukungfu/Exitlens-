'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { CategoryCount } from '@/lib/analytics/calculations';

interface ReasonsBarChartProps {
  data: CategoryCount[];
  limit?: number;
  title?: string;
  subtitle?: string;
}

const BAR_COLORS = [
  '#3b82f6',
  '#6366f1',
  '#0d9488',
  '#f59e0b',
  '#0284c7',
  '#8b5cf6',
  '#10b981',
  '#ec4899',
  '#f97316',
  '#64748b',
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryCount;
  }>;
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-3 text-xs text-slate-800 min-w-44">
        <p className="font-bold text-slate-900 text-xs mb-1">
          {item.name}
        </p>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">Total Separations:</span>
          <span className="font-mono font-bold text-blue-600 tabular-nums">
            {item.count} ({item.percentage}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function ReasonsBarChart({
  data,
  limit = 8,
  title = 'Primary Exit Reasons Distribution',
  subtitle = 'Frequency of stated primary departure drivers',
}: ReasonsBarChartProps) {
  const chartData = data.slice(0, limit);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No reason data available for active filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all duration-200">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200/70">
          Top {chartData.length}
        </span>
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
              width={150}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: string) => (val.length > 22 ? `${val.slice(0, 21)}…` : val)}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
