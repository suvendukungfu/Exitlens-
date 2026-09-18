'use client';

import React, { useMemo } from 'react';
import {
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { exportExitRecordsToExcel } from '@/lib/excel/exporter';
import {
  calculateOverviewMetrics,
  calculateDepartmentExits,
  calculatePlantExits,
  calculateReasonDistribution,
} from '@/lib/analytics/calculations';

export default function ReportsPage() {
  const { filteredRecords, records, filterState, headcounts } = useExitData();

  const metrics = useMemo(
    () => calculateOverviewMetrics(filteredRecords, headcounts),
    [filteredRecords, headcounts]
  );
  const deptDist = useMemo(() => calculateDepartmentExits(filteredRecords), [filteredRecords]);
  const plantDist = useMemo(() => calculatePlantExits(filteredRecords), [filteredRecords]);
  const reasonDist = useMemo(() => calculateReasonDistribution(filteredRecords), [filteredRecords]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportExitRecordsToExcel(
      filteredRecords,
      `SteelStripsWheels_Exit_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="pb-12">
      <TopHeader
        title="Executive Reports & Document Generation"
        subtitle="Produce publication-ready executive dossiers, print clean PDF digests, and export customized Excel sheets."
        actionButton={
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded-lg hover:bg-slate-700/80 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print / Save PDF</span>
          </button>
        }
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Print Only Title Block */}
        <div className="hidden print-only mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Steel Strips Wheels Limited</h1>
          <h2 className="text-base text-slate-600">Executive Employee Exit & Retention Intelligence Report</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generated on {new Date().toLocaleDateString()} | Active Filtered Dataset ({filteredRecords.length} records)
          </p>
        </div>

        {/* Report Overview Header Card */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Executive Dossier
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
                Executive Separation Digest
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Synthesis of workforce movements across plants, departments, and tenure brackets
              </p>
            </div>

            <div className="no-print flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Print Document</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Active Filter Scope Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs flex flex-wrap gap-5 text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Filter Scope:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {filterState.dateRange.preset !== 'ALL' ? filterState.dateRange.preset : 'All Historic Data'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Plants Included:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {filterState.plant.length > 0 ? filterState.plant.join(', ') : 'All Plants'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Departments Included:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {filterState.department.length > 0 ? filterState.department.join(', ') : 'All Departments'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Total Exits in Report:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {filteredRecords.length} / {records.length} Records
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0e1422] p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center relative overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.04)] border-t-2 border-t-blue-500">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Exits</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1 font-mono tracking-tight">
              {metrics.totalExits}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">In Active Scope</span>
          </div>

          <div className="bg-white dark:bg-[#0e1422] p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center relative overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.04)] border-t-2 border-t-emerald-500">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold">Voluntary Ratio</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1 font-mono tracking-tight">
              {metrics.voluntaryPercentage}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.voluntaryExits} Resignations</span>
          </div>

          <div className="bg-white dark:bg-[#0e1422] p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center relative overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.04)] border-t-2 border-t-violet-500">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold">Average Tenure</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1 font-mono tracking-tight">
              {metrics.averageTenureYears}y
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Median: {metrics.medianTenureYears} yrs</span>
          </div>

          <div className="bg-white dark:bg-[#0e1422] p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center relative overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.04)] border-t-2 border-t-amber-500">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold">Early Exit Risk</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 block mt-1 font-mono tracking-tight">
              {metrics.earlyExitPercentage}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">&lt; 1 Year of Service</span>
          </div>
        </div>

        {/* Section 1: Departmental Breakdown Table */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Departmental Breakdown Summary
          </h3>
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5 font-semibold">Department</th>
                  <th className="p-3.5 font-semibold text-center">Exits</th>
                  <th className="p-3.5 font-semibold text-center">Voluntary</th>
                  <th className="p-3.5 font-semibold text-center">Share</th>
                  <th className="p-3.5 font-semibold text-right">Avg Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {deptDist.map((d) => (
                  <tr key={d.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{d.name}</td>
                    <td className="p-3.5 text-center font-bold font-mono text-slate-900 dark:text-white">{d.count}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">{d.voluntaryCount}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">{d.percentage}%</td>
                    <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-300">{d.averageTenureYears} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Leading Reasons Breakdown */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Leading Stated Exit Drivers
          </h3>
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5 font-semibold">Primary Exit Reason</th>
                  <th className="p-3.5 font-semibold text-center">Recorded Count</th>
                  <th className="p-3.5 font-semibold text-center">Percentage Share</th>
                  <th className="p-3.5 font-semibold text-right">Avg Tenure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {reasonDist.slice(0, 8).map((r) => (
                  <tr key={r.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{r.name}</td>
                    <td className="p-3.5 text-center font-bold font-mono text-slate-900 dark:text-white">{r.count}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">{r.percentage}%</td>
                    <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-300">{r.averageTenureYears} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Plant Comparison Table */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            3. Manufacturing Facilities Comparison
          </h3>
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5 font-semibold">Plant Location</th>
                  <th className="p-3.5 font-semibold text-center">Exits</th>
                  <th className="p-3.5 font-semibold text-center">Share</th>
                  <th className="p-3.5 font-semibold text-center">Voluntary Count</th>
                  <th className="p-3.5 font-semibold text-right">Avg Tenure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {plantDist.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="p-3.5 text-center font-bold font-mono text-slate-900 dark:text-white">{p.count}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">{p.percentage}%</td>
                    <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-300">{p.voluntaryCount}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-300">{p.averageTenureYears} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer / Signature Area for Printing */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-end">
          <div>
            <span className="text-slate-800 dark:text-slate-300 font-semibold">Prepared for: Steel Strips Wheels Corporate HR</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ExitLens Analytics Engine v2.1</span>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-slate-300 dark:border-slate-700 w-48 mb-1.5" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Authorized Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
