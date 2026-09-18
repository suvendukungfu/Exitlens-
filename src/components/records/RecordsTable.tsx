'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { ExitRecord } from '@/lib/types';
import { RecordDetailsDrawer } from './RecordDetailsDrawer';
import { exportExitRecordsToExcel } from '@/lib/excel/exporter';
import { isVoluntaryExit } from '@/lib/analytics/calculations';

interface RecordsTableProps {
  records: ExitRecord[];
  showEmployeeNames: boolean;
  setShowEmployeeNames: (val: boolean) => void;
}

type SortField =
  | 'employeeId'
  | 'employeeName'
  | 'department'
  | 'plant'
  | 'joiningDate'
  | 'lastWorkingDate'
  | 'tenureYears'
  | 'primaryReason'
  | 'exitType';

type SortDirection = 'asc' | 'desc';

export function RecordsTable({
  records,
  showEmployeeNames,
  setShowEmployeeNames,
}: RecordsTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastWorkingDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [selectedRecord, setSelectedRecord] = useState<ExitRecord | null>(null);

  // Column visibility state
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    designation: true,
    joiningDate: true,
    tenure: true,
    exitType: true,
    secondaryReason: false,
    interviewStatus: true,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    const list = [...records];
    list.sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [records, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  return (
    <div className="space-y-3.5">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {records.length}
          </span>
          <span className="text-slate-500">records found</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-500 font-mono">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Privacy Toggle */}
          <button
            onClick={() => setShowEmployeeNames(!showEmployeeNames)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs font-semibold shadow-2xs active:scale-98 ${
              showEmployeeNames
                ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25'
            }`}
            title="Toggle masking of employee names"
          >
            {showEmployeeNames ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Names Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                <span>Names Masked</span>
              </>
            )}
          </button>

          {/* Export button */}
          <button
            onClick={() => exportExitRecordsToExcel(records)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer text-xs font-medium shadow-2xs active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Table</span>
          </button>

          {/* Column Visibility Selector */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer text-xs font-medium shadow-2xs active:scale-98"
              title="Toggle Visible Columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Columns</span>
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2.5 z-30 space-y-1 text-xs animate-in fade-in duration-100">
                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.designation}
                    onChange={(e) => setVisibleColumns((p) => ({ ...p, designation: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Designation</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.joiningDate}
                    onChange={(e) => setVisibleColumns((p) => ({ ...p, joiningDate: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Joining Date</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.tenure}
                    onChange={(e) => setVisibleColumns((p) => ({ ...p, tenure: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tenure</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.exitType}
                    onChange={(e) => setVisibleColumns((p) => ({ ...p, exitType: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Exit Type</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.interviewStatus}
                    onChange={(e) => setVisibleColumns((p) => ({ ...p, interviewStatus: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Exit Interview</span>
                </label>
              </div>
            )}
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 font-mono text-xs focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 select-none sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th
                  onClick={() => handleSort('employeeId')}
                  className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Emp ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('employeeName')}
                  className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {visibleColumns.designation && (
                  <th className="p-3.5 font-bold">Designation</th>
                )}

                <th
                  onClick={() => handleSort('department')}
                  className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('plant')}
                  className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Plant</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {visibleColumns.joiningDate && (
                  <th
                    onClick={() => handleSort('joiningDate')}
                    className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Joining</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                <th
                  onClick={() => handleSort('lastWorkingDate')}
                  className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Exit Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {visibleColumns.tenure && (
                  <th
                    onClick={() => handleSort('tenureYears')}
                    className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tenure</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.exitType && (
                  <th
                    onClick={() => handleSort('exitType')}
                    className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Exit Type</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                <th
                  onClick={() => handleSort('primaryReason')}
                  className="p-3.5 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Primary Reason</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {visibleColumns.interviewStatus && (
                  <th className="p-3.5 font-bold text-center">Interview</th>
                )}

                <th className="p-3.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-400">
                    No matching records found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => {
                  const isVoluntary = isVoluntaryExit(rec.exitType);
                  const initials = (rec.employeeName || 'E')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {rec.employeeId}
                      </td>

                      <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {initials}
                          </div>
                          <span className="truncate max-w-36">
                            {showEmployeeNames ? rec.employeeName : '••••••••••••'}
                          </span>
                        </div>
                      </td>

                      {visibleColumns.designation && (
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 truncate max-w-36">
                          {rec.designation}
                        </td>
                      )}

                      <td className="p-3.5 text-slate-600 dark:text-slate-300 truncate max-w-40">
                        {rec.department}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {rec.plant.split(' ')[0]}
                      </td>

                      {visibleColumns.joiningDate && (
                        <td className="p-3.5 text-slate-500 font-mono text-[11px] tabular-nums">
                          {rec.joiningDate}
                        </td>
                      )}

                      <td className="p-3.5 text-slate-500 font-mono text-[11px] tabular-nums">
                        {rec.lastWorkingDate}
                      </td>

                      {visibleColumns.tenure && (
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {rec.tenureYears} yrs
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {rec.tenureBucket}
                          </span>
                        </td>
                      )}

                      {visibleColumns.exitType && (
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                              isVoluntary
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isVoluntary ? 'bg-blue-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{rec.exitType}</span>
                          </span>
                        </td>
                      )}

                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {rec.primaryReason}
                        </span>
                        {rec.secondaryReason && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-44">
                            {rec.secondaryReason}
                          </span>
                        )}
                      </td>

                      {visibleColumns.interviewStatus && (
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              rec.exitInterviewCompleted === 'Yes'
                                ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                                : rec.exitInterviewCompleted === 'No'
                                ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
                                : 'bg-amber-400 shadow-xs shadow-amber-400/50'
                            }`}
                            title={`Exit Interview: ${rec.exitInterviewCompleted || 'Pending'}`}
                          />
                        </td>
                      )}

                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(rec);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="View Full Dossier"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/50 text-xs">
          <span className="text-slate-500 tabular-nums">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedRecords.length)} of {sortedRecords.length}{' '}
            records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Details Slide-over Drawer */}
      <RecordDetailsDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        showEmployeeNames={showEmployeeNames}
      />
    </div>
  );
}
