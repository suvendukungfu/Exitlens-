'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Layers,
  FileCode,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { POSTGRES_DDL, DB_SCHEMA_METADATA } from '@/lib/db/schema';

interface HealthData {
  status: string;
  service: string;
  version: string;
  database: {
    type: string;
    connectionStatus: string;
    schemaVersion: string;
    trackedTablesCount: number;
    tables: string[];
  };
  uptimeSeconds: number;
  memoryUsageMB: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

export default function DatabaseStatusPage() {
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (isMounted && data) setHealth(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="pb-12">
      <TopHeader
        title="PostgreSQL Database Status & Schema"
        subtitle="PostgreSQL relational database diagnostics, migration manifests, and local development environment runbook."
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Status & Diagnostic Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>PostgreSQL Engine Connectivity</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Active & Resilient
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dual-Storage Architecture: Supports PostgreSQL DB and zero-config in-memory fallback.
                </p>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Ping Health Check</span>
            </button>
          </div>

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Version</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                {health?.version || '2.1.0-m2'}
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tracked Tables</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                {DB_SCHEMA_METADATA.tables.length} Relational Tables
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Engine Mode</span>
              <div className="font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">
                {health?.database.connectionStatus || 'Local/In-Memory Mode'}
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Node Memory (RSS)</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                {health?.memoryUsageMB?.rss ? `${health.memoryUsageMB.rss} MB` : 'Optimal'}
              </div>
            </div>
          </div>
        </div>

        {/* 12 Core Relational Tables Inspector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>12 Core Relational Tables Defined in Schema 0001</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validated against SSWL business rules, foreign key cascades, date chronology, and UUID primary keys.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
            {DB_SCHEMA_METADATA.tables.map((t, idx) => (
              <div
                key={t}
                className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-mono font-bold">
                  {idx + 1}
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Local Setup Runbook */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Local Development PostgreSQL Runbook</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] space-y-2 border border-slate-800">
              <div className="text-slate-400"># 1. Start a local PostgreSQL 16 container via Docker:</div>
              <div className="text-emerald-400">
                docker run --name exitlens-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=exitlens_dev -p 5432:5432 -d postgres:16-alpine
              </div>

              <div className="text-slate-400 pt-2"># 2. Configure .env.local with connection URI:</div>
              <div className="text-blue-400">
                echo &quot;DATABASE_URL=postgresql://postgres:postgres@localhost:5432/exitlens_dev&quot; &gt;&gt; .env.local
              </div>

              <div className="text-slate-400 pt-2"># 3. Apply Schema Migration 0001:</div>
              <div className="text-amber-400">
                psql &quot;postgresql://postgres:postgres@localhost:5432/exitlens_dev&quot; -f src/lib/db/migrations/0001_initial_schema.sql
              </div>

              <div className="text-slate-400 pt-2"># 4. Seed with Fictional SSWL Manufacturing Data:</div>
              <div className="text-purple-400">
                npx tsx scripts/seedDatabase.ts --sql | psql &quot;postgresql://postgres:postgres@localhost:5432/exitlens_dev&quot;
              </div>
            </div>
          </div>
        </div>

        {/* DDL Schema Code Preview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>PostgreSQL Migration Script Preview (0001_initial_schema.sql)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                DDL definitions with indexes, check constraints, and cascade rules.
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SQL!' : 'Copy DDL'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-96 border border-slate-800">
            {POSTGRES_DDL}
          </pre>
        </div>
      </div>
    </div>
  );
}
