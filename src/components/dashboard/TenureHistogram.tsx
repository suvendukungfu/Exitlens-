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
  CartesianGrid,
} from 'recharts';
import { TenureBucket } from '@/lib/types';

interface TenureHistogramItem {
  bucket: TenureBucket;
  count: number;
  percentage: number;
}

interface TenureHistogramProps {
  data: TenureHistogramItem[];
  title?: string;
  subtitle?: string;
}

const BUCKET_COLORS = [
  '#f43f5e', // 0-3m (highest early turnover risk)
  '#f59e0b', // 3-6m
  '#3b82f6', // 6-12m
  '#6366f1', // 1-2y
  '#8b5cf6', // 2-5y
  '#0d9488', // 5+y (veterans)
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TenureHistogramItem;
  }>;
}

function CustomTenureTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-3 text-xs text-slate-800 min-w-44">
        <p className="font-bold text-slate-900 text-xs mb-1">
          Tenure: {item.bucket}
        </p>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">Separations:</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">
            {item.count} ({item.percentage}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function TenureHistogram({
  data,
  title = 'Tenure Distribution at Exit',
  subtitle = 'Service length before recorded departure (joining to last working date)',
}: TenureHistogramProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No tenure data available.
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
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
            <XAxis
              dataKey="bucket"
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
            <Tooltip content={<CustomTenureTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Calculation: (Last Working Date || Resignation Date) - Joining Date</span>
        <span className="font-semibold text-rose-500">
          Rose/Amber indicates &lt;6 month early departures
        </span>
      </div>
    </div>
  );
}
