'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  History,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { downloadExcelTemplate } from '@/lib/excel/templateGenerator';
import { parseExcelFile } from '@/lib/excel/parser';
import { validateUploadedRows } from '@/lib/validation/excelSchema';
import { exportValidationErrorReport } from '@/lib/excel/exporter';
import { ValidationSummary } from '@/lib/types';
import { ImportBatchService } from '@/lib/services/importBatchService';

type ImportStep = 1 | 2 | 3 | 4 | 5 | 6;

export default function ImportPage() {
  const { records, importRecords, masterData } = useExitData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'errors' | 'warnings'>('all');

  // Step 1: Download Template
  const handleDownloadTemplate = () => {
    downloadExcelTemplate('employee_exit_register_template.xlsx');
  };

  // Step 2: Handle File Drop / Select
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadError(null);
    setDuplicateWarning(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setDuplicateWarning(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.csv')
    ) {
      setUploadError('Invalid file format. Please upload an Excel workbook (.xlsx or .xls).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit. Please upload a smaller register.');
      return;
    }

    setSelectedFile(file);
    setCurrentStep(3); // Moving to validation step

    try {
      // Parse file
      const rawRows = await parseExcelFile(file);
      if (rawRows.length === 0) {
        setUploadError('The uploaded Excel sheet appears to be empty or contains only headers.');
        setCurrentStep(2);
        return;
      }

      // Check for duplicate batches
      const dupCheck = ImportBatchService.isDuplicateBatch(file.name, rawRows.length);
      if (dupCheck.isDuplicate) {
        setDuplicateWarning(
          `Notice: An identical file "${file.name}" with ${rawRows.length} rows was previously uploaded in batch ${dupCheck.previousBatch?.id}.`
        );
      } else {
        setDuplicateWarning(null);
      }

      // Validate rows
      const validation = validateUploadedRows(rawRows, records, masterData);
      setValidationResult(validation);
      setCurrentStep(4); // Move to Preview
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to parse Excel workbook. Please verify the sheet structure.';
      setUploadError(msg);
      setCurrentStep(2);
    }
  };

  // Reconcile append stats
  const reconciliation = React.useMemo(() => {
    if (!validationResult) return { newCount: 0, updateCount: 0 };
    const existingIds = new Set(records.map((r) => r.employeeId.toUpperCase()));
    let newC = 0;
    let updC = 0;
    validationResult.parsedRecords.forEach((r) => {
      if (existingIds.has(r.employeeId.toUpperCase())) {
        updC++;
      } else {
        newC++;
      }
    });
    return { newCount: newC, updateCount: updC };
  }, [validationResult, records]);

  const { newCount, updateCount } = reconciliation;

  // Step 5: Confirm Import
  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validRows === 0) return;

    try {
      importRecords(
        validationResult.parsedRecords,
        {
          filename: selectedFile?.name || 'uploaded_register.xlsx',
          totalRows: validationResult.totalRows,
          importedRows: validationResult.validRows,
          skippedRows: validationResult.errorRows,
          warningCount: validationResult.warnings.length,
        },
        importMode
      );

      setCurrentStep(6); // Success
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed due to security or schema constraint.';
      setUploadError(msg);
      setCurrentStep(4);
    }
  };

  // Download error report
  const handleDownloadErrors = () => {
    if (validationResult) {
      exportValidationErrorReport(validationResult.errors, validationResult.warnings);
    }
  };

  const resetWizard = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setUploadError(null);
    setCurrentStep(1);
  };

  const steps = [
    { num: 1, label: 'Template' },
    { num: 2, label: 'Upload' },
    { num: 3, label: 'Validate' },
    { num: 4, label: 'Preview' },
    { num: 5, label: 'Confirm' },
    { num: 6, label: 'Complete' },
  ];

  return (
    <div className="pb-16">
      <TopHeader
        title="Standardized Excel Import Pipeline"
        subtitle="Multi-stage validation, cell integrity verification, and reconciliation before database entry."
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Wizard Steps Progress Bar */}
        <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-medium tracking-tight truncate ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : isDone
                        ? 'text-slate-800 dark:text-slate-200 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Download Template */}
        {currentStep === 1 && (
          <div className="relative bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6.5 shadow-xs space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 to-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Step 1: Obtain the Standardized Exit Register Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                To guarantee data accuracy, all employee separations must follow the standardized Steel Strips Wheels register model.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/25 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>What is included in the workbook?</span>
              </div>
              <ul className="text-xs text-blue-900 dark:text-blue-200/90 space-y-2 list-disc pl-5 leading-relaxed">
                <li>
                  <strong>Exit_Register:</strong> Pre-formatted header columns with sample rows, mandatory field indicators, and date formats.
                </li>
                <li>
                  <strong>Reason_Master:</strong> The 15 approved corporate exit reason categories with definitions.
                </li>
                <li>
                  <strong>Instructions:</strong> Complete data dictionary, date chronology rules (Joining &le; Resignation &le; LWD), and confidentiality guidance.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Download Template (.xlsx)</span>
              </button>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-98"
              >
                <span>Already Have Completed File? Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Upload Excel */}
        {currentStep === 2 && (
          <div className="relative bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6.5 shadow-xs space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 to-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Step 2: Upload Your Completed Exit Register
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Drop your filled Excel spreadsheet here. The file will be validated row by row before any data is committed.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/40 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3.5 transition-transform duration-200 group-hover:scale-110">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag and drop your Excel file here
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports .xlsx and .xls formats (Maximum 15MB)
              </span>
            </div>

            {uploadError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Import Error</span>
                  <span className="mt-0.5 block">{uploadError}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Template</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Validating Processing Spinner */}
        {currentStep === 3 && (
          <div className="bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-14 text-center shadow-xs space-y-4">
            <RefreshCw className="w-9 h-9 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Validating Excel Data Integrity...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Scanning column structures, parsing date chronology, validating category taxonomies, and detecting duplicate employee IDs.
            </p>
          </div>
        )}

        {/* STEP 4: Validation Summary & Interactive Preview */}
        {currentStep === 4 && validationResult && (
          <div className="relative bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6.5 shadow-xs space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 to-indigo-600" />
            <div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Step 4: Validation Results & Record Preview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    File: <strong className="text-slate-700 dark:text-slate-300">{selectedFile?.name}</strong> • Scanned {validationResult.totalRows} data rows
                  </p>
                </div>

                {validationResult.errors.length > 0 && (
                  <button
                    onClick={handleDownloadErrors}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Error Report (.xlsx)</span>
                  </button>
                )}
              </div>
            </div>

            {duplicateWarning && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {/* Validation Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-xs">
              <div className="bg-slate-50/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wider">Total Scanned</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block font-mono tabular-nums">
                  {validationResult.totalRows}
                </span>
              </div>

              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/25">
                <span className="text-emerald-700 dark:text-emerald-400 block font-bold text-[11px] uppercase tracking-wider">
                  Ready to Import
                </span>
                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 block font-mono tabular-nums">
                  {validationResult.validRows}
                </span>
              </div>

              <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/25">
                <span className="text-amber-700 dark:text-amber-400 block font-bold text-[11px] uppercase tracking-wider">
                  Warnings
                </span>
                <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1 block font-mono tabular-nums">
                  {validationResult.warningRows}
                </span>
              </div>

              <div className="bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/25">
                <span className="text-rose-700 dark:text-rose-400 block font-bold text-[11px] uppercase tracking-wider">
                  Critical Errors
                </span>
                <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1 block font-mono tabular-nums">
                  {validationResult.errorRows}
                </span>
              </div>
            </div>

            {/* Filter Toggle for Issues vs Valid */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    previewFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Valid Records ({validationResult.parsedRecords.length})
                </button>
                <button
                  onClick={() => setPreviewFilter('errors')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    previewFilter === 'errors'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Critical Errors ({validationResult.errors.length})
                </button>
                <button
                  onClick={() => setPreviewFilter('warnings')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    previewFilter === 'warnings'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Warnings ({validationResult.warnings.length})
                </button>
              </div>

              <span className="text-slate-400 text-xs hidden sm:inline">
                {previewFilter === 'all'
                  ? 'Showing verified rows ready for entry'
                  : 'Showing identified cell issues'}
              </span>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-xl max-h-72 shadow-2xs">
              {previewFilter === 'all' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 text-slate-500 dark:text-slate-400 select-none">
                    <tr>
                      <th className="p-3 font-bold">Emp ID</th>
                      <th className="p-3 font-bold">Name</th>
                      <th className="p-3 font-bold">Department</th>
                      <th className="p-3 font-bold">Plant</th>
                      <th className="p-3 font-bold">Exit Date</th>
                      <th className="p-3 font-bold">Tenure</th>
                      <th className="p-3 font-bold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {validationResult.parsedRecords.slice(0, 10).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{r.employeeId}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{r.employeeName}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{r.department}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{r.plant.split(' ')[0]}</td>
                        <td className="p-3 font-mono text-[11px] tabular-nums">{r.lastWorkingDate}</td>
                        <td className="p-3 font-semibold tabular-nums">{r.tenureYears} yrs</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200">{r.primaryReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {previewFilter === 'errors' && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {validationResult.errors.length === 0 ? (
                    <div className="p-8 text-center text-emerald-600 font-semibold text-xs">
                      No critical errors detected.
                    </div>
                  ) : (
                    validationResult.errors.map((err, i) => (
                      <div key={i} className="p-3.5 text-xs flex items-start gap-2.5 bg-rose-500/5">
                        <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-rose-900 dark:text-rose-300">
                            Row {err.rowNumber} [{err.field}]:
                          </span>
                          <span className="ml-1.5 text-slate-700 dark:text-slate-300">{err.message}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {previewFilter === 'warnings' && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {validationResult.warnings.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No warnings detected.
                    </div>
                  ) : (
                    validationResult.warnings.map((w, i) => (
                      <div key={i} className="p-3.5 text-xs flex items-start gap-2.5 bg-amber-500/5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-300">
                            Row {w.rowNumber} [{w.field}]:
                          </span>
                          <span className="ml-1.5 text-slate-700 dark:text-slate-300">{w.message}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <button
                onClick={resetWizard}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium"
              >
                Cancel & Re-upload
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(5)}
                  disabled={validationResult.validRows === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer active:scale-98 transition-all"
                >
                  <span>Proceed to Import Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Confirm Import */}
        {currentStep === 5 && validationResult && (
          <div className="relative bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6.5 shadow-xs space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 to-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Step 5: Confirm Data Commitment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose how you want to integrate the verified records into the active analytics dataset.
              </p>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => setImportMode('append')}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'append'
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-500/10 dark:bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm">
                  Append & Merge (Recommended)
                </span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Adds the {validationResult.validRows} verified records to your current active dataset. Duplicate Employee IDs will be updated with the latest file values.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-blue-700 dark:text-blue-300 space-y-0.5">
                  <div>• {newCount} new employee record{newCount !== 1 ? 's' : ''} to append</div>
                  <div>• {updateCount} existing record{updateCount !== 1 ? 's' : ''} to update</div>
                </div>
              </div>

              <div
                onClick={() => setImportMode('replace')}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'replace'
                    ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-500/10 dark:bg-rose-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm">
                  Replace Entire Dataset
                </span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Clears all current records ({records.length} existing) and replaces them completely with the {validationResult.validRows} rows from this spreadsheet.
                </p>
                <div className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  ⚠️ Destructive action: Requires confirmation modal
                </div>
              </div>
            </div>

            {validationResult.errorRows > 0 && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>
                  Notice: {validationResult.errorRows} rows containing critical errors will be skipped.
                </span>
                <button
                  onClick={handleDownloadErrors}
                  className="font-bold underline underline-offset-2 hover:text-amber-950 cursor-pointer"
                >
                  Download Error Report
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <button
                onClick={() => setCurrentStep(4)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
              >
                Back to Preview
              </button>

              <button
                onClick={() => {
                  if (importMode === 'replace') {
                    setShowReplaceModal(true);
                  } else {
                    handleConfirmImport();
                  }
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98 ${
                  importMode === 'replace'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {importMode === 'replace' ? 'Review & Confirm Replace' : `Commit & Import ${validationResult.validRows} Records`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Import Success */}
        {currentStep === 6 && (
          <div className="relative bg-white/90 dark:bg-[#0e1422]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-12 text-center shadow-xs space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-emerald-500 to-teal-500" />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Data Import Successfully Executed!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your exit register has been processed, verified, and committed to the active analytics engine. All dashboards, charts, and record queries are now updated.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
              >
                <span>Go to Overview Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/import/history"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-bold transition-all"
              >
                <History className="w-4 h-4" />
                <span>View in Import History</span>
              </Link>
              <Link
                href="/records"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <span>View Exit Records Table</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Replace Dataset Confirmation */}
      {showReplaceModal && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6.5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/25">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Confirm Complete Dataset Replacement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This destructive operation cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Current active records:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{records.length} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">New records to commit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{validationResult.validRows} records</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <span className="text-slate-500">Final dataset size:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{validationResult.validRows} records</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              All existing exit records will be permanently replaced. System configurations (Plant lists, Reason Master, and Headcount settings) will <strong>not</strong> be affected.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  handleConfirmImport();
                }}
                className="px-4.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-500/25 transition-all cursor-pointer active:scale-98"
              >
                Confirm & Replace All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
