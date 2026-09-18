'use client';

import React, { useState, useMemo } from 'react';
import { Factory, MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import {
  calculatePlantExits,
  calculateReasonByPlantMatrix,
  calculateOverviewMetrics,
} from '@/lib/analytics/calculations';
import { ReasonDepartmentHeatmap } from '@/components/dashboard/ReasonDepartmentHeatmap';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    payload?: { percentage?: number; count?: number };
  }>;
  label?: string;
}

function PlantCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const pct = entry.payload?.percentage;
  return (
    <div className="bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xl p-3 text-xs text-slate-800 dark:text-slate-100 min-w-42.5">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">{label || entry.name}</p>
      <div className="flex items-center justify-between text-xs gap-3">
        <span className="text-slate-500 dark:text-slate-400">Recorded Exits:</span>
        <span className="font-semibold text-slate-900 dark:text-white font-mono">{entry.value}</span>
      </div>
      {pct !== undefined && (
        <div className="flex items-center justify-between text-xs gap-3 mt-1">
          <span className="text-slate-500 dark:text-slate-400">Share:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400 font-mono">{pct}%</span>
        </div>
      )}
    </div>
  );
}

export default function PlantsPage() {
  const { filteredRecords, headcounts } = useExitData();
  const [selectedPlant, setSelectedPlant] = useState<string>('Dappar (Punjab)');

  const plantCounts = useMemo(() => calculatePlantExits(filteredRecords), [filteredRecords]);
  const plantReasonMatrix = useMemo(
    () => calculateReasonByPlantMatrix(filteredRecords),
    [filteredRecords]
  );

  // Selected plant records
  const selectedPlantRecords = useMemo(
    () => filteredRecords.filter((r) => r.plant === selectedPlant),
    [filteredRecords, selectedPlant]
  );

  const selectedMetrics = useMemo(
    () => calculateOverviewMetrics(selectedPlantRecords, headcounts.filter((h) => h.plant === selectedPlant)),
    [selectedPlantRecords, headcounts, selectedPlant]
  );

  // Department distribution for selected plant
  const plantDeptData = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedPlantRecords.forEach((r) => {
      counts[r.department] = (counts[r.department] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          selectedPlantRecords.length > 0
            ? Number(((count / selectedPlantRecords.length) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [selectedPlantRecords]);

  // Employment type distribution for selected plant
  const plantEmpTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedPlantRecords.forEach((r) => {
      const empType = r.employmentType || 'Permanent';
      counts[empType] = (counts[empType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage:
        selectedPlantRecords.length > 0
          ? Number(((count / selectedPlantRecords.length) * 100).toFixed(1))
          : 0,
    }));
  }, [selectedPlantRecords]);

  return (
    <div className="pb-12">
      <TopHeader
        title="Manufacturing Plants Analysis"
        subtitle="Geographic exit comparisons across Steel Strips Wheels operating facilities."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Plant Cards Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {plantCounts.map((plant) => {
            const isSelected = selectedPlant === plant.name;
            return (
              <div
                key={plant.name}
                onClick={() => setSelectedPlant(plant.name)}
                className={`bg-white dark:bg-[#0e1422] border rounded-2xl p-4.5 cursor-pointer transition-all shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] relative overflow-hidden group ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${isSelected ? 'bg-linear-to-r from-blue-600 to-indigo-600 opacity-100' : 'opacity-0 group-hover:opacity-40 bg-slate-400'}`} />
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {plant.name.split(' ')[0]}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
                  {plant.count} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">exits</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Share: {plant.percentage}%</span>
                  <span>Avg: {plant.averageTenureYears}y</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plant Overview Header */}
        <div className="flex items-center justify-between bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 p-4.5 rounded-2xl shadow-[0_4px_16px_rgba(15,23,42,0.04)] text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <Factory className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Selected Facility:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-md border border-blue-200 dark:border-blue-500/20">
              {selectedPlant}
            </span>
          </div>

          <div className="flex items-center gap-5 text-slate-600 dark:text-slate-300 font-mono font-medium">
            <span>Voluntary: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{selectedMetrics.voluntaryPercentage}%</span></span>
            <span>Median Tenure: <span className="text-slate-900 dark:text-white font-semibold">{selectedMetrics.medianTenureYears} yrs</span></span>
          </div>
        </div>

        {/* Charts Row: Department Breakdown & Employment Type within selected plant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department breakdown for plant */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Department Breakdown at {selectedPlant.split(' ')[0]}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Functional distribution of recorded separations at this plant
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={plantDeptData.slice(0, 6)}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
                  />
                  <Tooltip content={<PlantCustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employment type breakdown for plant */}
          <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)] relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Employment Type Mix at {selectedPlant.split(' ')[0]}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Permanent vs Contractual vs Apprentice departures
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={plantEmpTypeData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    width={130}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<PlantCustomTooltip />} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cross-Plant Heatmap Matrix: Plant x Reason */}
        <ReasonDepartmentHeatmap
          matrix={plantReasonMatrix}
          title="Plant × Exit Reason Matrix"
          subtitle="Cross-tabulation showing how primary exit reasons vary across manufacturing locations"
        />
      </div>
    </div>
  );
}
