'use client';

import React, { useState } from 'react';
import { RefreshCw, Download, Calendar, UserCheck, ChevronDown, Shield, Factory, Eye, UserCog, Sparkles, Check } from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { useDevAuth } from '@/lib/auth/DevAuthContext';
import { exportExitRecordsToExcel } from '@/lib/excel/exporter';
import { AuditService } from '@/lib/services/auditService';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export function TopHeader({ title, subtitle, actionButton }: TopHeaderProps) {
  const { filteredRecords, records, isDemoData, resetFilters } = useExitData();
  const { currentUser, switchPersona, personas } = useDevAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleExport = () => {
    AuditService.logEvent('EXPORT_GENERATED', currentUser, 'report_export', {
      plant: currentUser.assignedPlant || 'Global',
      metadata: {
        recordCount: filteredRecords.length,
        exportType: 'Excel .xlsx',
      },
    });
    exportExitRecordsToExcel(filteredRecords);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CORP_HR':
        return <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'PLANT_HR':
        return <Factory className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'HR_ADMIN':
        return <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'VIEWER':
        return <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />;
      default:
        return <UserCog className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="no-print bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 sticky top-0 z-20 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title Area */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {isDemoData && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Demo Dataset
              </span>
            )}
            {currentUser.role === 'PLANT_HR' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 flex items-center gap-1">
                <Factory className="w-3 h-3" />
                <span>Restricted: {currentUser.assignedPlant} Plant</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            {subtitle || 'Enterprise departure analytics and retention diagnostics across manufacturing facilities.'}
          </p>
        </div>

        {/* Action Controls & Persona Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active User Persona Badge & Quick Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs text-left cursor-pointer"
              title="Switch user role persona for testing"
            >
              <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                {getRoleIcon(currentUser.role)}
              </div>
              <div className="text-[11px] leading-tight pr-0.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-32">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-32">
                  {currentUser.roleTitle} {currentUser.assignedPlant ? `(${currentUser.assignedPlant})` : ''}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Enterprise Role Simulation
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Switch persona to test plant isolation & permissions:
                    </p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {personas.map((p) => {
                      const isSelected = p.id === currentUser.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchPersona(p.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                              : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {getRoleIcon(p.role)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {p.roleTitle} {p.assignedPlant ? `• Plant: ${p.assignedPlant}` : '• Corporate'}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredRecords.length}</span>
            <span className="text-slate-400">/</span>
            <span>{records.length} records</span>
          </div>

          <button
            onClick={resetFilters}
            title="Reset active filters"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm shadow-blue-500/20 active:scale-98 cursor-pointer ring-1 ring-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {actionButton}
        </div>
      </div>
    </div>
  );
}
