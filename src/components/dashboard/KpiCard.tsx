'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'neutral' | 'info' | 'warning' | 'success';
  icon?: LucideIcon;
  helperText?: string;
}

export function KpiCard({
  label,
  value,
  subtitle,
  badge,
  badgeType = 'neutral',
  icon: Icon,
  helperText,
}: KpiCardProps) {
  const badgeStyles = {
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
    warning: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25',
    success: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25',
  }[badgeType];

  const topBorderGlow = {
    neutral: 'from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800',
    info: 'from-blue-600 via-indigo-500 to-sky-400',
    warning: 'from-amber-500 via-orange-500 to-yellow-400',
    success: 'from-emerald-500 via-teal-500 to-green-400',
  }[badgeType];

  const iconBg = {
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/40',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40',
  }[badgeType];

  return (
    <div className="group relative bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4.5 shadow-2xs hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
      {/* Top Subtle Gradient Edge Highlight */}
      <div className={`absolute top-0 inset-x-0 h-0.75 bg-linear-to-r ${topBorderGlow} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {Icon && (
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconBg}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {value}
          </span>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${badgeStyles}`}>
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {helperText && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/70">
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-normal leading-tight">
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
}
