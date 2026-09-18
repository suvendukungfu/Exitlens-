'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MonthlyTrendItem } from '@/lib/analytics/calculations';

interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
  title?: string;
  subtitle?: string;
}

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

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs text-slate-800 min-w-44">
        <p className="font-bold text-slate-900 text-xs mb-2 pb-1.5 border-b border-slate-100">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 font-medium">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function MonthlyTrendChart({
  data,
  title = 'Monthly Exit Volume Trend',
  subtitle = 'Recorded separations per month with 3-month moving average',
}: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No exit records found for the selected filter period.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
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
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
            <Line
              type="monotone"
              dataKey="count"
              name="Total Exits"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#3b82f6', strokeWidth: 1.5, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              name="3-Mo Moving Avg"
              stroke="#0d9488"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="voluntary"
              name="Voluntary Exits"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
