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
import { CategoryCount } from '@/lib/analytics/calculations';

interface PlantBarChartProps {
  data: CategoryCount[];
  title?: string;
  subtitle?: string;
}

interface PlantChartItem extends CategoryCount {
  shortName: string;
  involuntaryCount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PlantChartItem;
  }>;
}

function CustomPlantTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl p-3.5 text-xs text-white min-w-48">
        <p className="font-bold text-slate-200 text-xs mb-1.5 pb-1 border-b border-slate-800">
          {item.name}
        </p>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-300">Voluntary:</span>
            </div>
            <span className="font-mono font-bold text-blue-400 tabular-nums">
              {item.voluntaryCount || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-300">Involuntary:</span>
            </div>
            <span className="font-mono font-bold text-slate-300 tabular-nums">
              {item.involuntaryCount || 0}
            </span>
          </div>
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-3 font-semibold">
            <span className="text-slate-400">Total Separations:</span>
            <span className="font-mono text-white tabular-nums">
              {item.count} ({item.percentage}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function PlantBarChart({
  data,
  title = 'Plant-wise Exit Distribution',
  subtitle = 'Separations across Steel Strips Wheels manufacturing units',
}: PlantBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No plant records available.
        </div>
      </div>
    );
  }

  const chartData: PlantChartItem[] = data.map((d) => ({
    ...d,
    shortName: d.name.split(' ')[0],
    involuntaryCount: d.count - (d.voluntaryCount || 0),
  }));

  return (
    <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} className="dark:stroke-slate-800" />
            <XAxis
              dataKey="shortName"
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
            <Tooltip content={<CustomPlantTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="voluntaryCount" name="Voluntary" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="involuntaryCount" name="Involuntary / Contract" fill="#94a3b8" stackId="a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
