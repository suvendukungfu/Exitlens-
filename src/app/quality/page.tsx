'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';

interface DataIssue {
  id: string;
  empId: string;
  name: string;
  field: string;
  issue: string;
  severity: 'critical' | 'warning' | 'notice';
  suggestion: string;
}

export default function DataQualityPage() {
  const { records, filteredRecords, dataQualityScore, masterData } = useExitData();
  const [auditScope, setAuditScope] = useState<'filtered' | 'all'>('filtered');

  const targetRecords = auditScope === 'filtered' ? filteredRecords : records;

  // Audit calculations
  const auditResults = useMemo(() => {
    let missingReasons = 0;
    let missingDepts = 0;
    let missingPlants = 0;
    let missingJoining = 0;
    let missingExit = 0;
    let duplicateIds = 0;
    let invalidDates = 0;
    let unknownCategories = 0;

    const issues: DataIssue[] = [];
    const seenIds = new Set<string>();

    const validReasons = new Set(masterData.primaryReasons.map((r) => r.category.toLowerCase()));
    const validDepts = new Set(masterData.departments.map((d) => d.name.toLowerCase()));
    const validPlants = new Set(masterData.plants.map((p) => p.toLowerCase()));

    targetRecords.forEach((r, idx) => {
      const normalizedId = r.employeeId?.trim().toUpperCase();

      // Check duplicate ID
      if (seenIds.has(normalizedId)) {
        duplicateIds++;
        issues.push({
          id: `ISSUE-DUP-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Employee ID',
          issue: 'Duplicate ID detected across organization records.',
          severity: 'critical',
          suggestion: 'Ensure unique corporate employee number is assigned.',
        });
      } else {
        seenIds.add(normalizedId);
      }

      // Check missing reason
      if (!r.primaryReason || r.primaryReason === 'Unknown / Not Disclosed') {
        missingReasons++;
        issues.push({
          id: `ISSUE-RSN-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Primary Reason',
          issue: 'Exit reason recorded as Unknown or blank.',
          severity: 'warning',
          suggestion: 'Conduct retrospective HR follow-up or check resignation email archive.',
        });
      } else if (!validReasons.has(r.primaryReason.toLowerCase())) {
        unknownCategories++;
        issues.push({
          id: `ISSUE-CAT-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Primary Reason',
          issue: `Non-standard reason category "${r.primaryReason}".`,
          severity: 'notice',
          suggestion: 'Remap to one of the 15 standard master reason taxonomies.',
        });
      }

      // Check missing or invalid department
      if (!r.department || r.department === 'Unassigned') {
        missingDepts++;
        issues.push({
          id: `ISSUE-DPT-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Department',
          issue: 'Missing functional department assignment.',
          severity: 'critical',
          suggestion: 'Assign employee to plant operational unit.',
        });
      } else if (!validDepts.has(r.department.toLowerCase())) {
        unknownCategories++;
        issues.push({
          id: `ISSUE-DPT-VAL-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Department',
          issue: `Non-standard department "${r.department}".`,
          severity: 'warning',
          suggestion: 'Verify against approved organizational department master.',
        });
      }

      // Check missing or invalid plant
      if (!r.plant || r.plant === 'Unknown Plant') {
        missingPlants++;
        issues.push({
          id: `ISSUE-PLT-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Plant',
          issue: 'Missing manufacturing plant location.',
          severity: 'critical',
          suggestion: 'Verify employee master facility code.',
        });
      } else if (!validPlants.has(r.plant.toLowerCase())) {
        unknownCategories++;
        issues.push({
          id: `ISSUE-PLT-VAL-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Plant',
          issue: `Unrecognized facility location "${r.plant}".`,
          severity: 'warning',
          suggestion: 'Ensure plant matches one of the 5 authorized Steel Strips Wheels facilities.',
        });
      }

      // Check dates
      if (!r.joiningDate) {
        missingJoining++;
        issues.push({
          id: `ISSUE-JDT-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Joining Date',
          issue: 'Missing joining date prevents accurate tenure calculation.',
          severity: 'critical',
          suggestion: 'Cross-reference with employee joining letter / appointment letter.',
        });
      }

      if (!r.lastWorkingDate) {
        missingExit++;
        issues.push({
          id: `ISSUE-LWD-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Last Working Date',
          issue: 'Missing last working date.',
          severity: 'critical',
          suggestion: 'Record effective date of separation.',
        });
      }

      if (r.joiningDate && r.lastWorkingDate && r.joiningDate > r.lastWorkingDate) {
        invalidDates++;
        issues.push({
          id: `ISSUE-CHR-${idx}`,
          empId: r.employeeId,
          name: r.employeeName,
          field: 'Chronology',
          issue: 'Joining date is recorded after last working date.',
          severity: 'critical',
          suggestion: 'Correct inverted joining and exit dates.',
        });
      }
    });

    return {
      missingReasons,
      missingDepts,
      missingPlants,
      missingJoining,
      missingExit,
      duplicateIds,
      invalidDates,
      unknownCategories,
      issues,
    };
  }, [targetRecords, masterData]);

  return (
    <div className="pb-12">
      <TopHeader
        title="Data Quality & Integrity Audit"
        subtitle="Verifying completeness, chronological integrity, and category standardization across exit records."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Quality Score Banner */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Explainable Data Completeness Index
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Evaluated strictly against mandatory enterprise parameters: valid unique employee ID, plant facility, functional department, joining date, and exit timestamp.
            </p>
            <div className="pt-2.5 flex items-center gap-2.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Audit Scope:</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-inner">
                <button
                  onClick={() => setAuditScope('filtered')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    auditScope === 'filtered'
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Active Filter Scope ({filteredRecords.length})
                </button>
                <button
                  onClick={() => setAuditScope('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    auditScope === 'all'
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Entire Database ({records.length})
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-4">
            <div className="text-right">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {dataQualityScore}%
              </span>
              <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {dataQualityScore >= 90 ? 'High Integrity' : 'Action Recommended'}
              </span>
            </div>
            <div className="w-28 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 h-3.5 rounded-full overflow-hidden self-center p-0.5 shadow-inner">
              <div
                className="bg-linear-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${dataQualityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Audit Metrics Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Missing Exit Reasons"
            value={auditResults.missingReasons}
            subtitle="Unknown or unspecified reasons"
            icon={HelpCircle}
            badge={auditResults.missingReasons === 0 ? 'Zero Gaps' : 'Requires Review'}
            badgeType={auditResults.missingReasons === 0 ? 'success' : 'warning'}
            helperText="Key metric for root-cause analytics"
          />

          <KpiCard
            label="Duplicate Employee IDs"
            value={auditResults.duplicateIds}
            subtitle="Identical employee numbers"
            icon={AlertTriangle}
            badge={auditResults.duplicateIds === 0 ? 'Clean' : 'Critical'}
            badgeType={auditResults.duplicateIds === 0 ? 'success' : 'warning'}
            helperText="Must be unique per employee"
          />

          <KpiCard
            label="Chronological Anomalies"
            value={auditResults.invalidDates}
            subtitle="Inverted joining vs exit dates"
            icon={Calendar}
            badge={auditResults.invalidDates === 0 ? 'Clean' : 'Invalid'}
            badgeType={auditResults.invalidDates === 0 ? 'success' : 'warning'}
            helperText="Joining Date ≤ Last Working Date"
          />

          <KpiCard
            label="Non-Standard Taxonomies"
            value={auditResults.unknownCategories}
            subtitle="Values outside 15 master categories"
            icon={Layers}
            badge={auditResults.unknownCategories === 0 ? 'Aligned' : 'Notice'}
            badgeType={auditResults.unknownCategories === 0 ? 'success' : 'neutral'}
            helperText="Check Reason Master standard"
          />
        </div>

        {/* Actionable Issue Audit Table */}
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Identified Record Integrity Exceptions ({auditResults.issues.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Actionable log of records with missing, invalid, or non-standard entries
              </p>
            </div>

            <Link
              href="/import"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Upload Corrected Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5 font-semibold w-28">Emp ID</th>
                  <th className="p-3.5 font-semibold w-36">Field</th>
                  <th className="p-3.5 font-semibold w-28">Severity</th>
                  <th className="p-3.5 font-semibold">Integrity Exception Description</th>
                  <th className="p-3.5 font-semibold">Recommended Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {auditResults.issues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-emerald-600 dark:text-emerald-400 font-medium">
                      All loaded records comply 100% with enterprise data integrity standards!
                    </td>
                  </tr>
                ) : (
                  auditResults.issues.slice(0, 20).map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-medium text-blue-600 dark:text-blue-400">
                        {issue.empId || 'N/A'}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {issue.field}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            issue.severity === 'critical'
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                              : issue.severity === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                              : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                          }`}
                        >
                          {issue.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {issue.issue}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        {issue.suggestion}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>Showing top exception items</span>
            <span>Audited according to ISO/QMS HR guidelines</span>
          </div>
        </div>
      </div>
    </div>
  );
}
