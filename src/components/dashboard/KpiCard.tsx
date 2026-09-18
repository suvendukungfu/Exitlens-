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
  // Restrained, calm enterprise badge styling: compact, subtle borders, no saturated pills
  const badgeStyles = {
    neutral: 'bg-slate-50 text-slate-600 border-slate-200/80',
    info: 'bg-slate-50 text-slate-600 border-slate-200/80',
    warning: 'bg-amber-50/70 text-amber-800 border-amber-200/60',
    success: 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60',
  }[badgeType];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors flex flex-col justify-between min-h-36">
      <div>
        {/* Header Row: Label & subtle monochrome line icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 tracking-normal truncate" title={label}>
            {label}
          </span>
          {Icon && (
            <Icon className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
          )}
        </div>

        {/* Metric Value & Optional Restrained Badge */}
        <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
          {badge && (
            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border leading-tight ${badgeStyles}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Supporting description / context */}
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 leading-relaxed truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Footer Helper */}
      {helperText && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 leading-tight truncate" title={helperText}>
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
}

