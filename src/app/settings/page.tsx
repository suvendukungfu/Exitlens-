'use client';

import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Check,
  FileCode,
  Building2,
  Factory,
  Layers,
  Percent,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { POSTGRES_DDL } from '@/lib/db/schema';

export default function SettingsPage() {
  const {
    masterData,
    setMasterData,
    headcounts,
    isDemoData,
    loadDemoData,
    clearData,
    records,
  } = useExitData();

  const [activeTab, setActiveTab] = useState<'master' | 'headcount' | 'database' | 'demo'>('master');
  const [newPlant, setNewPlant] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newReason, setNewReason] = useState('');
  const [copiedDdl, setCopiedDdl] = useState(false);

  // Add Plant
  const handleAddPlant = () => {
    if (!newPlant.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      plants: [...prev.plants, newPlant.trim()],
    }));
    setNewPlant('');
  };

  // Remove Plant
  const handleRemovePlant = (plant: string) => {
    setMasterData((prev) => ({
      ...prev,
      plants: prev.plants.filter((p) => p !== plant),
    }));
  };

  // Add Department
  const handleAddDept = () => {
    if (!newDept.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      departments: [...prev.departments, { name: newDept.trim(), subDepartments: ['General'] }],
    }));
    setNewDept('');
  };

  // Add Reason
  const handleAddReason = () => {
    if (!newReason.trim()) return;
    setMasterData((prev) => ({
      ...prev,
      primaryReasons: [
        ...prev.primaryReasons,
        { category: newReason.trim(), description: 'Custom corporate reason' },
      ],
    }));
    setNewReason('');
  };

  // Copy DDL
  const handleCopyDdl = () => {
    navigator.clipboard.writeText(POSTGRES_DDL);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2500);
  };

  return (
    <div className="pb-12">
      <TopHeader
        title="Application Settings & Master Data"
        subtitle="Configure organizational taxonomies, manage plant headcounts for attrition formulas, and preview database schemas."
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'master', label: 'Master Taxonomies', icon: Layers },
            { id: 'headcount', label: 'Headcount & Attrition', icon: Percent },
            { id: 'database', label: 'PostgreSQL Architecture', icon: Database },
            { id: 'demo', label: 'Dataset Controls', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'master' | 'headcount' | 'database' | 'demo')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md ring-1 ring-blue-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Master Taxonomies */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {/* Plants Master */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <Factory className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>Manufacturing Plants & Locations ({masterData.plants.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Recognized manufacturing units for Steel Strips Wheels
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Add new plant name (e.g. Pune Unit 2)..."
                  value={newPlant}
                  onChange={(e) => setNewPlant(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-inner"
                />
                <button
                  onClick={handleAddPlant}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plant</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {masterData.plants.map((plant) => (
                  <span
                    key={plant}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-sm"
                  >
                    <span>{plant}</span>
                    <button
                      onClick={() => handleRemovePlant(plant)}
                      className="text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove plant"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Departments Master */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl space-y-5 relative overflow-hidden">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <Building2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>Standard Functional Departments ({masterData.departments.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Approved organizational divisions
                </p>
              </div>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Add new department..."
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-inner"
                />
                <button
                  onClick={handleAddDept}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dept</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {masterData.departments.map((dept) => (
                  <span
                    key={dept.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60 shadow-sm"
                  >
                    <span>{dept.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Reason Categories Master */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <Layers className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>Standard Exit Reason Categories ({masterData.primaryReasons.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Taxonomy categories used for root-cause analytics
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="New reason category..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="px-3.5 py-1.5 text-xs rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-inner"
                  />
                  <button
                    onClick={handleAddReason}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                {masterData.primaryReasons.map((r, i) => (
                  <div
                    key={r.category}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold text-white block">
                        {i + 1}. {r.category}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{r.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Headcount Configuration */}
        {activeTab === 'headcount' && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl space-y-5 relative overflow-hidden">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <Percent className="w-4 h-4 text-blue-400" />
                </div>
                <span>Plant Headcount Register for True Attrition Rate</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Attrition Rate is calculated strictly as <code className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded font-mono">Exits during period / Average Headcount during period × 100</code>. Unlike generic dashboards, ExitLens never fabricates headcount or conflates raw exit count with attrition percentage.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="p-3 font-semibold">Plant</th>
                    <th className="p-3 font-semibold">Department</th>
                    <th className="p-3 font-semibold text-center">Year</th>
                    <th className="p-3 font-semibold text-right">Active Headcount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {headcounts.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-white">{h.plant}</td>
                      <td className="p-3 text-slate-400">{h.department}</td>
                      <td className="p-3 text-center font-mono text-slate-300">{h.year}</td>
                      <td className="p-3 text-right font-bold text-white font-mono">
                        {h.headcount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Total active headcount tracked across plants: <strong>{(headcounts.reduce((a, b) => a + b.headcount, 0) / 2).toLocaleString()} avg employees</strong></span>
            </div>
          </div>
        )}

        {/* TAB 3: PostgreSQL Architecture */}
        {activeTab === 'database' && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>PostgreSQL DDL & Production Readiness</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  This application is architected with Drizzle ORM schemas ready to link to a PostgreSQL database
                </p>
              </div>

              <button
                onClick={handleCopyDdl}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                {copiedDdl ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                <span>{copiedDdl ? 'DDL Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800 shadow-inner leading-relaxed">
              {POSTGRES_DDL}
            </pre>
          </div>
        )}

        {/* TAB 4: Dataset Controls */}
        {activeTab === 'demo' && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-xl p-6 shadow-xl space-y-5 relative overflow-hidden">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <span>Dataset State Controls</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Current active records: <strong className="text-white font-mono">{records.length}</strong> • Mode:{' '}
                <strong className={isDemoData ? 'text-amber-400' : 'text-emerald-400'}>{isDemoData ? 'Demo Mode Active' : 'Live Imported Data'}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-3 shadow-lg">
                <span className="font-bold text-white block text-sm">
                  Reload Standard Demo Dataset
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Restores the rich, fictional manufacturing dataset for Steel Strips Wheels (~115 records across 5 plants).
                </p>
                <button
                  onClick={loadDemoData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reload Demo Dataset</span>
                </button>
              </div>

              <div className="p-5 rounded-xl border border-rose-900/40 space-y-3 bg-rose-950/20 shadow-lg">
                <span className="font-bold text-rose-300 block text-sm">
                  Clear All Data (Empty State)
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Wipes all records to test clean empty states, zero-data validations, and fresh file uploads.
                </p>
                <button
                  onClick={clearData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Records</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
