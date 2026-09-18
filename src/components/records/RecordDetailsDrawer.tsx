'use client';

import React from 'react';
import {
  X,
  Calendar,
  FileText,
  Shield,
} from 'lucide-react';
import { ExitRecord } from '@/lib/types';

interface DrawerProps {
  record: ExitRecord | null;
  onClose: () => void;
  showEmployeeNames: boolean;
}

export function RecordDetailsDrawer({
  record,
  onClose,
  showEmployeeNames,
}: DrawerProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between bg-slate-50/60 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/25">
                  {record.employeeId}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700/60">
                  {record.plant}
                </span>
              </div>
              <h2 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {showEmployeeNames ? record.employeeName : 'Confidential Employee'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {record.designation} • {record.department}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* 1. Service Timeline */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Service Timeline & Tenure</span>
              </h3>
              <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Joining Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {record.joiningDate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Resignation Submitted:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {record.resignationDate || 'Not Recorded'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Last Working Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                    {record.lastWorkingDate}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Calculated Total Tenure:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/25">
                    {record.tenureYears} Years ({record.tenureBucket})
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Separation Reason & Verbatim Comments */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Departure Analysis</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 text-[11px] font-medium block mb-1">Primary Stated Reason</span>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                    {record.primaryReason}
                  </div>
                </div>

                {record.secondaryReason && (
                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block mb-1">Secondary Driver</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                      {record.secondaryReason}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 text-[11px] font-medium block mb-1">Employee Exit Remarks</span>
                  <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    &ldquo;{record.detailedReason || 'No detailed comments provided during exit interview.'}&rdquo;
                  </div>
                </div>

                {record.hrRemarks && (
                  <div>
                    <span className="text-slate-400 text-[11px] font-medium block mb-1">HR Internal Notes</span>
                    <div className="text-slate-600 dark:text-slate-400 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                      {record.hrRemarks}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Operational & HR Governance */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Operational Governance</span>
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Exit Classification</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {record.exitType}
                  </span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Notice Period</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                    {record.noticePeriod ?? 30} Days
                  </span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Exit Interview</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {record.exitInterviewCompleted || 'Yes'}
                  </span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Replacement</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {record.replacementRequired || 'Pending'}
                  </span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Rehire Eligibility</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {record.rehireEligible || 'Yes'}
                  </span>
                </div>
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Salary Band</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                    {record.salaryBand || 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/70 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
