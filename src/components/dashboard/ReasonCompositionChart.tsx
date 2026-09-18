'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlyReasonCompositionItem } from '@/lib/analytics/calculations';

interface ReasonCompositionProps {
  data: MonthlyReasonCompositionItem[];
  title?: string;
  subtitle?: string;
}

const STACK_COLORS = [
  '#3b82f6', // Reason 1
  '#0d9488', // Reason 2
  '#f59e0b', // Reason 3
  '#6366f1', // Reason 4
  '#f43f5e', // Reason 5
  '#64748b', // Other Reasons
];

interface TooltipPayloadEntry {
  name?: string;
  value?: string | number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomCompTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xl p-3.5 text-xs text-slate-800 dark:text-slate-100 min-w-48">
        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
          {label}
        </p>
        <div className="space-y-1 text-[11px]">
          {payload.map((entry, index) => {
            if (!entry.value) return null;
            return (
              <div key={`entry-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-32 font-medium">{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

export function ReasonCompositionChart({
  data,
  title = 'Monthly Reason Composition Trend',
  subtitle = 'Shift in key departure drivers across successive calendar months',
}: ReasonCompositionProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No monthly reason data available.
        </div>
      </div>
    );
  }

  // Get dynamic keys (excluding month, label, total)
  const first = data[0] || {};
  const reasonKeys = Object.keys(first).filter(
    (k) => k !== 'month' && k !== 'label' && k !== 'total'
  );

  return (
    <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} className="dark:stroke-slate-800" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.5 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomCompTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            {reasonKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                name={key}
                stackId="composition"
                fill={STACK_COLORS[idx % STACK_COLORS.length]}
                radius={idx === reasonKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
