'use client';

import React from 'react';
import { MatrixData } from '@/lib/analytics/calculations';

interface HeatmapProps {
  matrix: MatrixData;
  title?: string;
  subtitle?: string;
}

export function ReasonDepartmentHeatmap({
  matrix,
  title = 'Exit Reason × Department Matrix',
  subtitle = 'Co-occurrence density between primary exit driver and functional department',
}: HeatmapProps) {
  const { rows, columns, values, maxVal } = matrix;

  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    return (
      <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <div className="h-48 flex items-center justify-center text-xs text-slate-400">
          Insufficient data to compute cross-tabulation matrix.
        </div>
      </div>
    );
  }

  // Get cell color intensity based on value relative to maxVal
  const getCellBg = (val: number) => {
    if (val === 0) return 'bg-slate-50/50 dark:bg-slate-800/20 text-slate-400/60 dark:text-slate-600';
    const ratio = maxVal > 0 ? val / maxVal : 0;
    if (ratio < 0.25) return 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 font-medium border border-blue-200/40 dark:border-blue-900/40';
    if (ratio < 0.5) return 'bg-blue-200 text-blue-950 dark:bg-blue-900/80 dark:text-blue-100 font-semibold border border-blue-300/50 dark:border-blue-800/50';
    if (ratio < 0.75) return 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white font-bold shadow-xs';
    return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-sm shadow-blue-500/20';
  };

  return (
    <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-800/60">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-900/60">
              <th className="p-3 font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 w-44">
                Primary Reason
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="p-3 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-800/80 text-center truncate max-w-28"
                  title={col}
                >
                  {col.length > 14 ? `${col.slice(0, 13)}…` : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {rows.map((row) => (
              <tr key={row} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-44" title={row}>
                  {row}
                </td>
                {columns.map((col) => {
                  const val = values[row]?.[col] || 0;
                  return (
                    <td key={`${row}-${col}`} className="p-1.5 text-center">
                      <div
                        className={`py-1 px-2 rounded-md text-[11px] font-mono tabular-nums transition-transform duration-150 hover:scale-110 cursor-default ${getCellBg(
                          val
                        )}`}
                        title={`${row} in ${col}: ${val} separations`}
                      >
                        {val > 0 ? val : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3.5 flex items-center justify-end gap-2 text-[10.5px] text-slate-400 font-medium">
        <span>Low Density</span>
        <div className="flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-100 dark:bg-blue-950/70" />
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-200 dark:bg-blue-900/80" />
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 dark:bg-blue-600" />
          <span className="w-3.5 h-3.5 rounded-sm bg-indigo-600" />
        </div>
        <span>High Density</span>
      </div>
    </div>
  );
}
