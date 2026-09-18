'use client';

import React, { useState } from 'react';
import {
  Filter,
  X,
  Search,
  ChevronDown,
  Factory,
  Building2,
  Layers,
  Check,
  Command,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';

export function FilterBar() {
  const { filterState, setFilterState, resetFilters, masterData } = useExitData();
  const [isExpanded, setIsExpanded] = useState(false);

  // Active filter count (excluding searchQuery and preset='ALL')
  const activeFilterCount =
    (filterState.plant.length > 0 ? 1 : 0) +
    (filterState.department.length > 0 ? 1 : 0) +
    (filterState.subDepartment.length > 0 ? 1 : 0) +
    (filterState.employmentType.length > 0 ? 1 : 0) +
    (filterState.exitType.length > 0 ? 1 : 0) +
    (filterState.primaryReason.length > 0 ? 1 : 0) +
    (filterState.dateRange.preset !== 'ALL' ? 1 : 0);

  const handlePlantToggle = (plant: string) => {
    setFilterState((prev) => {
      const exists = prev.plant.includes(plant);
      return {
        ...prev,
        plant: exists ? prev.plant.filter((p) => p !== plant) : [...prev.plant, plant],
      };
    });
  };

  const handleDeptToggle = (dept: string) => {
    setFilterState((prev) => {
      const exists = prev.department.includes(dept);
      return {
        ...prev,
        department: exists ? prev.department.filter((d) => d !== dept) : [...prev.department, dept],
      };
    });
  };

  const handleReasonToggle = (reason: string) => {
    setFilterState((prev) => {
      const exists = prev.primaryReason.includes(reason);
      return {
        ...prev,
        primaryReason: exists ? prev.primaryReason.filter((r) => r !== reason) : [...prev.primaryReason, reason],
      };
    });
  };

  const handleDatePreset = (preset: 'ALL' | 'THIS_YEAR' | 'LAST_12_MONTHS' | 'LAST_YEAR') => {
    let start = '';
    let end = '';
    const now = new Date();

    if (preset === 'THIS_YEAR') {
      start = `${now.getFullYear()}-01-01`;
      end = `${now.getFullYear()}-12-31`;
    } else if (preset === 'LAST_YEAR') {
      start = `${now.getFullYear() - 1}-01-01`;
      end = `${now.getFullYear() - 1}-12-31`;
    } else if (preset === 'LAST_12_MONTHS') {
      const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      start = twelveMonthsAgo.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    }

    setFilterState((prev) => ({
      ...prev,
      dateRange: { start, end, preset },
    }));
  };

  return (
    <div className="no-print bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-2.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Search & Command Bar */}
        <div className="flex items-center gap-2.5 flex-1 min-w-64 max-w-md">
          <div className="relative w-full group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Dept, Plant, Reason..."
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {filterState.searchQuery ? (
              <button
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-200/50 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/50 pointer-events-none">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Trigger & Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Range Presets Segmented Control */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-0.5 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              onClick={() => handleDatePreset('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filterState.dateRange.preset === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleDatePreset('THIS_YEAR')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filterState.dateRange.preset === 'THIS_YEAR'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2025
            </button>
            <button
              onClick={() => handleDatePreset('LAST_YEAR')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filterState.dateRange.preset === 'LAST_YEAR'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2024
            </button>
            <button
              onClick={() => handleDatePreset('LAST_12_MONTHS')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                filterState.dateRange.preset === 'LAST_12_MONTHS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 12M
            </button>
          </div>

          {/* Expand Filter Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs active:scale-98 ${
              activeFilterCount > 0
                ? 'bg-blue-50/90 border-blue-300 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline underline-offset-2 px-1 cursor-pointer font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expanded Multi-select Filter Panel */}
      {isExpanded && (
        <div className="mt-3 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-in fade-in duration-150">
          {/* Plant / Location Filter */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-2 text-[11px] tracking-tight">
              <Factory className="w-3.5 h-3.5 text-blue-500" />
              <span>Plant / Facility ({filterState.plant.length || 'All'})</span>
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {masterData.plants.map((plant) => {
                const selected = filterState.plant.includes(plant);
                return (
                  <button
                    key={plant}
                    type="button"
                    onClick={() => handlePlantToggle(plant)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer text-xs ${
                      selected
                        ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{plant}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Filter */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-2 text-[11px] tracking-tight">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Department ({filterState.department.length || 'All'})</span>
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {masterData.departments.map((dept) => {
                const selected = filterState.department.includes(dept.name);
                return (
                  <button
                    key={dept.name}
                    type="button"
                    onClick={() => handleDeptToggle(dept.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer text-xs ${
                      selected
                        ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Reason Filter */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-2 text-[11px] tracking-tight">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Exit Reason ({filterState.primaryReason.length || 'All'})</span>
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {masterData.primaryReasons.slice(0, 8).map((r) => {
                const selected = filterState.primaryReason.includes(r.category);
                return (
                  <button
                    key={r.category}
                    type="button"
                    onClick={() => handleReasonToggle(r.category)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer text-xs ${
                      selected
                        ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{r.category}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Employment Type & Exit Type Filter */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block text-[11px] tracking-tight">
                Employment Type
              </label>
              <select
                value={filterState.employmentType[0] || ''}
                onChange={(e) =>
                  setFilterState((prev) => ({
                    ...prev,
                    employmentType: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Employment Types</option>
                {masterData.employmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block text-[11px] tracking-tight">
                Exit Type
              </label>
              <select
                value={filterState.exitType[0] || ''}
                onChange={(e) =>
                  setFilterState((prev) => ({
                    ...prev,
                    exitType: e.target.value ? [e.target.value] : [],
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Exit Types</option>
                {masterData.exitTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active:</span>

          {filterState.plant.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs"
            >
              <span>Plant: {p.split(' ')[0]}</span>
              <button onClick={() => handlePlantToggle(p)} className="hover:text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filterState.department.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs"
            >
              <span>Dept: {d.split(' ')[0]}</span>
              <button onClick={() => handleDeptToggle(d)} className="hover:text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filterState.primaryReason.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs"
            >
              <span>Reason: {r.slice(0, 15)}...</span>
              <button onClick={() => handleReasonToggle(r)} className="hover:text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filterState.dateRange.preset !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span>Period: {filterState.dateRange.preset}</span>
              <button onClick={() => handleDatePreset('ALL')} className="hover:text-red-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
