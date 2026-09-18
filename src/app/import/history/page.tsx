'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  User,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { useDevAuth } from '@/lib/auth/DevAuthContext';
import { ImportBatchService, ImportBatch } from '@/lib/services/importBatchService';

export default function ImportHistoryPage() {
  const { currentUser } = useDevAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'partial' | 'failed'>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);

  const batches = ImportBatchService.getBatchHistory(currentUser);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.uploadedByEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalImportedRows = batches.reduce((acc, b) => acc + b.validRows, 0);
  const totalWarnings = batches.reduce((acc, b) => acc + b.warningCount, 0);
  const totalErrors = batches.reduce((acc, b) => acc + b.invalidRows, 0);

  const getStatusBadge = (status: ImportBatch['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Completed</span>
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Partial / Incomplete</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-12">
      <TopHeader
        title="Import Batch Registry & History"
        subtitle="Complete audit retrospective of all Excel ingestion batches, validation outcomes, and error logs."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Ingestion Batches
              </span>
              <History className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {batches.length}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Recorded across active lifecycle</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Processed Records
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {totalImportedRows.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">
              Valid rows successfully committed
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Validation Warnings
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {totalWarnings}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Non-fatal anomalies flagged</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Rejected / Invalid Rows
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {totalErrors}
            </div>
            <p className="mt-1 text-[11px] text-rose-600 font-medium">
              Blocked from database ingestion
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file name, batch ID, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {(['ALL', 'completed', 'partial', 'failed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Batches Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Batch ID & File</th>
                  <th className="p-3.5">Upload Timestamp</th>
                  <th className="p-3.5">Uploaded By</th>
                  <th className="p-3.5 text-center">Mode</th>
                  <th className="p-3.5 text-right">Rows Processed</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No import batches found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {batch.fileName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {batch.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(batch.uploadTimestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <span className="font-medium text-slate-800 block">
                              {batch.uploadedByEmail}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              {batch.uploadedByRole}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            batch.importMode === 'replace'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {batch.importMode}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <div>
                          <span className="font-bold text-emerald-600">
                            {batch.validRows}
                          </span>
                          <span className="text-slate-400"> / {batch.totalRows} valid</span>
                        </div>
                        {batch.invalidRows > 0 && (
                          <div className="text-[10px] text-rose-500 font-semibold">
                            {batch.invalidRows} errors
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">{getStatusBadge(batch.status)}</td>
                      <td className="p-3.5 text-right">
                        {batch.errors.length > 0 ? (
                          <button
                            onClick={() => setSelectedBatch(batch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
                          >
                            <span>Inspect Errors ({batch.errors.length})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedBatch(batch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-colors"
                          >
                            <span>Details</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error Details Modal Drawer */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Batch Retrospective: {selectedBatch.id}
                  </h3>
                  {getStatusBadge(selectedBatch.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  File: <code className="font-mono text-slate-700">{selectedBatch.fileName}</code>
                </p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Rows</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedBatch.totalRows}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-600 uppercase font-semibold">Valid Rows</span>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">
                    {selectedBatch.validRows}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-600 uppercase font-semibold">Invalid Rows</span>
                  <div className="text-xl font-bold text-rose-700 mt-0.5">
                    {selectedBatch.invalidRows}
                  </div>
                </div>
              </div>

              {selectedBatch.errorSummary && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>Validation Diagnostic:</strong> {selectedBatch.errorSummary}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Validation Log Breakdown ({selectedBatch.errors.length} items)
                </h4>

                {selectedBatch.errors.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                    No schema validation errors were registered for this batch. All rows met enterprise standards.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedBatch.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-start gap-2.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              Row {err.rowNumber} • Field: {err.field}
                            </span>
                            {err.employeeId && (
                              <span className="font-mono text-[11px] bg-slate-200 px-1.5 py-0.5 rounded">
                                {err.employeeId}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 mt-1">
                            {err.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold shadow-2xs hover:opacity-90 transition-opacity"
              >
                Close Retrospective
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
