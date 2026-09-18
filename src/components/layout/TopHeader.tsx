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
        return <UserCheck className="w-3.5 h-3.5 text-blue-600" />;
      case 'PLANT_HR':
        return <Factory className="w-3.5 h-3.5 text-amber-600" />;
      case 'HR_ADMIN':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'VIEWER':
        return <Eye className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <UserCog className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="no-print bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 sticky top-0 z-20 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title Area */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            {isDemoData && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/25">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Demo Dataset
              </span>
            )}
            {currentUser.role === 'PLANT_HR' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
                <Factory className="w-3 h-3" />
                <span>Restricted: {currentUser.assignedPlant} Plant</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {subtitle || 'Enterprise departure analytics and retention diagnostics across manufacturing facilities.'}
          </p>
        </div>

        {/* Action Controls & Persona Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active User Persona Badge & Quick Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs text-left cursor-pointer"
              title="Switch user role persona for testing"
            >
              <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                {getRoleIcon(currentUser.role)}
              </div>
              <div className="text-[11px] leading-tight pr-0.5">
                <div className="font-semibold text-slate-800 truncate max-w-32">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-32">
                  {currentUser.roleTitle} {currentUser.assignedPlant ? `(${currentUser.assignedPlant})` : ''}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Enterprise Role Simulation
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
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
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {getRoleIcon(p.role)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {p.roleTitle} {p.assignedPlant ? `• Plant: ${p.assignedPlant}` : '• Corporate'}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{filteredRecords.length}</span>
            <span className="text-slate-400">/</span>
            <span>{records.length} records</span>
          </div>

          <button
            onClick={resetFilters}
            title="Reset active filters"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-98 cursor-pointer ring-1 ring-blue-500/20"
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
