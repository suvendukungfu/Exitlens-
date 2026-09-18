'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { CategoryCount } from '@/lib/analytics/calculations';

interface ExitTypeDonutProps {
  data: CategoryCount[];
  title?: string;
  subtitle?: string;
}

const DONUT_COLORS = [
  '#3b82f6', // Voluntary Resignation (Primary blue)
  '#0d9488', // Retirement (Teal)
  '#f59e0b', // End of Contract (Amber)
  '#f43f5e', // Involuntary Termination (Rose)
  '#8b5cf6', // Mutual Separation (Purple)
  '#64748b', // Absconding / Other (Slate)
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryCount;
  }>;
}

function CustomDonutTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl p-3 text-xs text-white min-w-44">
        <p className="font-bold text-slate-200 text-xs mb-1">
          {item.name}
        </p>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400">Total Separations:</span>
          <span className="font-mono font-bold text-blue-400 tabular-nums">
            {item.count} ({item.percentage}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function ExitTypeDonut({
  data,
  title = 'Exit Type Breakdown',
  subtitle = 'Separation classifications across workforce',
}: ExitTypeDonutProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No exit type records available.
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
          <PieChart>
            <Tooltip content={<CustomDonutTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  stroke="rgba(15, 23, 42, 0.2)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
