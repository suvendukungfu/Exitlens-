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
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    info: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
    warning: 'bg-amber-500/10 text-amber-800 border-amber-500/25',
    success: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25',
  }[badgeType];

  const topBorderGlow = {
    neutral: 'from-slate-300 to-slate-200',
    info: 'from-blue-600 via-indigo-500 to-sky-400',
    warning: 'from-amber-500 via-orange-500 to-yellow-400',
    success: 'from-emerald-500 via-teal-500 to-green-400',
  }[badgeType];

  const iconBg = {
    neutral: 'bg-slate-100 text-slate-600',
    info: 'bg-blue-50 text-blue-600 border-blue-200/50',
    warning: 'bg-amber-50 text-amber-600 border-amber-200/50',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
  }[badgeType];

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between min-h-40">
      {/* Top Subtle Gradient Edge Highlight */}
      <div className={`absolute top-0 inset-0 h-1 bg-linear-to-r ${topBorderGlow} opacity-90 group-hover:opacity-100 transition-opacity`} />

      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1" title={label}>
            {label}
          </span>
          {Icon && (
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconBg}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${badgeStyles}`}>
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {helperText && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100">
          <p className="text-[10.5px] text-slate-400 font-normal leading-tight truncate" title={helperText}>
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
}
