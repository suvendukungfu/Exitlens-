'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ExitRecord,
  FilterState,
  MasterDataConfig,
  HeadcountConfig,
} from '../types';
import { DEMO_EXIT_RECORDS, DEMO_HEADCOUNTS } from '../demo/demoData';
import { INITIAL_MASTER_DATA } from '../constants/masterData';
import { INITIAL_FILTER_STATE, filterRecords } from '../analytics/filters';
import { useDevAuth } from '../auth/DevAuthContext';
import { AuthService } from '../services/authService';
import { AuditService } from '../services/auditService';
import { ImportBatchService } from '../services/importBatchService';

export interface ImportLog {
  id: string;
  timestamp: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  warningCount: number;
}

interface ExitDataContextType {
  records: ExitRecord[];
  filteredRecords: ExitRecord[];
  isDemoData: boolean;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  loadDemoData: () => void;
  clearData: () => void;
  importRecords: (newRecords: ExitRecord[], importMeta: Omit<ImportLog, 'id' | 'timestamp'>, mode?: 'append' | 'replace') => void;
  masterData: MasterDataConfig;
  setMasterData: React.Dispatch<React.SetStateAction<MasterDataConfig>>;
  headcounts: HeadcountConfig[];
  setHeadcounts: React.Dispatch<React.SetStateAction<HeadcountConfig[]>>;
  dataQualityScore: number;
  recentImports: ImportLog[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showEmployeeNames: boolean;
  setShowEmployeeNames: React.Dispatch<React.SetStateAction<boolean>>;
}

const ExitDataContext = createContext<ExitDataContextType | undefined>(undefined);

const STORAGE_KEY_RECORDS = 'exitlens_records_v1';
const STORAGE_KEY_IS_DEMO = 'exitlens_is_demo_v1';
const STORAGE_KEY_MASTER = 'exitlens_master_data_v1';
const STORAGE_KEY_HEADCOUNT = 'exitlens_headcount_v1';
const STORAGE_KEY_IMPORTS = 'exitlens_imports_v1';
const STORAGE_KEY_THEME = 'exitlens_theme_v1';

export function ExitDataProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ExitRecord[]>(() => {
    if (typeof window === 'undefined') return DEMO_EXIT_RECORDS;
    try {
      const isDemo = localStorage.getItem(STORAGE_KEY_IS_DEMO);
      if (isDemo === 'false') {
        const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEMO_EXIT_RECORDS;
  });

  const [isDemoData, setIsDemoData] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const isDemo = localStorage.getItem(STORAGE_KEY_IS_DEMO);
      if (isDemo !== null) return isDemo === 'true';
    } catch {
      // Fallback
    }
    return true;
  });

  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER_STATE);

  const [masterData, setMasterData] = useState<MasterDataConfig>(() => {
    if (typeof window === 'undefined') return INITIAL_MASTER_DATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MASTER);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_MASTER_DATA;
  });

  const [headcounts, setHeadcounts] = useState<HeadcountConfig[]>(() => {
    if (typeof window === 'undefined') return DEMO_HEADCOUNTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HEADCOUNT);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEMO_HEADCOUNTS;
  });

  const [recentImports, setRecentImports] = useState<ImportLog[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IMPORTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showEmployeeNames, setShowEmployeeNames] = useState<boolean>(true);

  // Sync DOM theme class on mount or theme change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as 'light' | 'dark' | null;
      if (saved) {
        document.documentElement.classList.toggle('dark', saved === 'dark');
      }
    } catch {
      // Fallback
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY_THEME, next);
        document.documentElement.classList.toggle('dark', next === 'dark');
      } catch {
        // Fallback
      }
      return next;
    });
  };

  const { currentUser, roleDef } = useDevAuth();

  const resetFilters = () => {
    setFilterState(INITIAL_FILTER_STATE);
  };

  const loadDemoData = () => {
    setRecords(DEMO_EXIT_RECORDS);
    setIsDemoData(true);
    setHeadcounts(DEMO_HEADCOUNTS);
    AuditService.logEvent('CONFIG_CHANGED', currentUser, 'dataset', {
      metadata: { action: 'Loaded demo dataset', recordCount: DEMO_EXIT_RECORDS.length },
    });
    try {
      localStorage.setItem(STORAGE_KEY_IS_DEMO, 'true');
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(DEMO_EXIT_RECORDS));
    } catch {
      // Fallback
    }
  };

  const clearData = () => {
    setRecords([]);
    setIsDemoData(false);
    AuditService.logEvent('CONFIG_CHANGED', currentUser, 'dataset', {
      metadata: { action: 'Cleared all records' },
    });
    try {
      localStorage.setItem(STORAGE_KEY_IS_DEMO, 'false');
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify([]));
    } catch {
      // Fallback
    }
  };

  const importRecords = (
    newRecords: ExitRecord[],
    meta: Omit<ImportLog, 'id' | 'timestamp'>,
    mode: 'append' | 'replace' = 'append'
  ) => {
    // Role-based security checks
    if (currentUser.role === 'VIEWER') {
      throw new Error('Permission Denied: Viewer role cannot import records.');
    }
    if (mode === 'replace' && !roleDef.canReplaceDataset) {
      throw new Error('Permission Denied: Only Corporate HR or HR Admin can replace the entire dataset.');
    }
    if (currentUser.role === 'PLANT_HR' && currentUser.assignedPlant) {
      const foreignRecord = newRecords.find(
        (r) => !AuthService.canAccessPlant(currentUser, r.plant)
      );
      if (foreignRecord) {
        throw new Error(
          `Security Rejection: Plant HR for ${currentUser.assignedPlant} cannot import record for plant "${foreignRecord.plant}".`
        );
      }
    }

    let updated: ExitRecord[];
    if (mode === 'replace') {
      updated = newRecords;
    } else {
      // Merge by employeeId: replace existing match or append
      const map = new Map<string, ExitRecord>();
      records.forEach((r) => map.set(r.employeeId.toUpperCase(), r));
      newRecords.forEach((r) => map.set(r.employeeId.toUpperCase(), r));
      updated = Array.from(map.values());
    }

    setRecords(updated);
    setIsDemoData(false);

    // Register batch and audit event
    const batch = ImportBatchService.createBatch(currentUser, {
      fileName: meta.filename,
      totalRows: meta.totalRows,
      validRows: meta.importedRows,
      invalidRows: meta.skippedRows,
      warningCount: meta.warningCount,
      importMode: mode,
    });

    try {
      localStorage.setItem(STORAGE_KEY_IS_DEMO, 'false');
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch {
      // Fallback
    }

    const newLog: ImportLog = {
      id: batch.id,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    const updatedLogs = [newLog, ...recentImports.slice(0, 9)];
    setRecentImports(updatedLogs);
    try {
      localStorage.setItem(STORAGE_KEY_IMPORTS, JSON.stringify(updatedLogs));
    } catch {
      // Fallback
    }
  };

  const filteredRecords = useMemo(() => {
    let sourceRecords = records;
    if (currentUser.role === 'PLANT_HR' && currentUser.assignedPlant) {
      sourceRecords = records.filter(
        (r) => AuthService.canAccessPlant(currentUser, r.plant)
      );
    }
    return filterRecords(sourceRecords, filterState);
  }, [records, filterState, currentUser]);

  // Explainable Data Completeness score
  // Formula: Percentage of essential required fields filled across all loaded records
  const dataQualityScore = useMemo(() => {
    if (records.length === 0) return 100;
    const essentialFields: (keyof ExitRecord)[] = [
      'employeeId',
      'plant',
      'department',
      'joiningDate',
      'lastWorkingDate',
      'exitType',
      'primaryReason',
    ];

    const totalPoints = records.length * essentialFields.length;
    let earnedPoints = 0;

    records.forEach((r) => {
      essentialFields.forEach((field) => {
        const val = r[field];
        if (val !== undefined && val !== null && String(val).trim() !== '' && val !== 'Unknown / Not Disclosed') {
          earnedPoints++;
        }
      });
    });

    return Number(((earnedPoints / totalPoints) * 100).toFixed(0));
  }, [records]);

  return (
    <ExitDataContext.Provider
      value={{
        records,
        filteredRecords,
        isDemoData,
        filterState,
        setFilterState,
        resetFilters,
        loadDemoData,
        clearData,
        importRecords,
        masterData,
        setMasterData,
        headcounts,
        setHeadcounts,
        dataQualityScore,
        recentImports,
        theme,
        toggleTheme,
        showEmployeeNames,
        setShowEmployeeNames,
      }}
    >
      {children}
    </ExitDataContext.Provider>
  );
}

export function useExitData() {
  const context = useContext(ExitDataContext);
  if (!context) {
    throw new Error('useExitData must be used within an ExitDataProvider');
  }
  return context;
}
