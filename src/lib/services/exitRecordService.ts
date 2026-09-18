/**
 * Enterprise Exit Record Service & Repository
 * Enforces role-based permissions, server-side plant data isolation,
 * and structured audit logging on all mutations.
 */

import { ExitRecord, FilterState, HeadcountConfig } from '../types';
import { AuthUser, AuthService } from './authService';
import { AuditService } from './auditService';
import { ImportBatchService } from './importBatchService';
import { DEMO_EXIT_RECORDS, DEMO_HEADCOUNTS } from '../demo/demoData';
import { filterRecords } from '../analytics/filters';
import { calculateOverviewMetrics } from '../analytics/calculations';

// Master data store for in-memory / mock database operations
let exitRecordsStore: ExitRecord[] = [...DEMO_EXIT_RECORDS];
let headcountStore: HeadcountConfig[] = [...DEMO_HEADCOUNTS];

export class ExitRecordService {
  /**
   * Fetch exit records bounded by user role authorization and active filters
   */
  static async getExitRecords(
    user: AuthUser,
    filters?: FilterState
  ): Promise<{ records: ExitRecord[]; totalCount: number; plantScope: string }> {
    let dataset = [...exitRecordsStore];

    // STRICT PLANT-LEVEL ACCESS CONTROL (Phase 4):
    // If the user is Plant HR, enforce their plant boundary regardless of filter requests
    if (user.role === 'PLANT_HR' && user.assignedPlant) {
      dataset = dataset.filter((r) => AuthService.canAccessPlant(user, r.plant));
    }

    // Apply additional multi-dimensional filters if provided
    if (filters) {
      dataset = filterRecords(dataset, filters);
    }

    return {
      records: dataset,
      totalCount: dataset.length,
      plantScope: user.role === 'PLANT_HR' ? user.assignedPlant || 'Assigned Plant' : 'All Plants',
    };
  }

  /**
   * Fetch single employee exit record by UUID or employee ID
   */
  static async getExitRecordById(user: AuthUser, id: string): Promise<ExitRecord | null> {
    const record = exitRecordsStore.find((r) => r.id === id || r.employeeId === id);
    if (!record) return null;

    // Check plant authorization
    if (!AuthService.canAccessPlant(user, record.plant)) {
      throw new Error(
        `Access Denied: You are not authorized to view employee records for plant "${record.plant}".`
      );
    }

    return record;
  }

  /**
   * Create a new employee exit record
   */
  static async createExitRecord(user: AuthUser, record: ExitRecord): Promise<ExitRecord> {
    // 1. Enforce Role Write Permissions
    if (!AuthService.canModifyRecords(user, record.plant)) {
      throw new Error(`Permission Denied: User role "${user.role}" cannot create records for plant "${record.plant}".`);
    }

    // 2. Validate joining date vs last working date
    if (new Date(record.joiningDate) > new Date(record.lastWorkingDate || '')) {
      throw new Error('Validation Error: Joining Date cannot be after Last Working Date.');
    }

    // 3. Persist record
    exitRecordsStore.unshift(record);

    // 4. Structured Audit Log (privacy-safe: remarks stripped)
    AuditService.logEvent('RECORD_CREATED', user, 'exit_record', {
      entityId: record.id,
      plant: record.plant,
      metadata: {
        employeeId: record.employeeId,
        department: record.department,
        exitType: record.exitType,
        primaryReason: record.primaryReason,
        tenureMonths: record.tenureMonths,
      },
    });

    return record;
  }

  /**
   * Update an existing exit record
   */
  static async updateExitRecord(
    user: AuthUser,
    id: string,
    updates: Partial<ExitRecord>
  ): Promise<ExitRecord> {
    const existingIndex = exitRecordsStore.findIndex((r) => r.id === id || r.employeeId === id);
    if (existingIndex === -1) {
      throw new Error(`Record with ID "${id}" not found.`);
    }

    const existingRecord = exitRecordsStore[existingIndex];

    // Check authorization for original plant and target plant (if moving plant)
    if (!AuthService.canModifyRecords(user, existingRecord.plant)) {
      throw new Error(`Permission Denied: Cannot modify records belonging to plant "${existingRecord.plant}".`);
    }
    if (updates.plant && !AuthService.canModifyRecords(user, updates.plant)) {
      throw new Error(`Permission Denied: Cannot transfer records to plant "${updates.plant}".`);
    }

    const updatedRecord: ExitRecord = {
      ...existingRecord,
      ...updates,
      id: existingRecord.id, // Immutable UUID PK
    };

    exitRecordsStore[existingIndex] = updatedRecord;

    // Audit update
    AuditService.logEvent('RECORD_UPDATED', user, 'exit_record', {
      entityId: updatedRecord.id,
      plant: updatedRecord.plant,
      metadata: {
        employeeId: updatedRecord.employeeId,
        modifiedFields: Object.keys(updates),
      },
    });

    return updatedRecord;
  }

  /**
   * Delete an exit record (HR Admin & Corporate HR only)
   */
  static async deleteExitRecord(user: AuthUser, id: string): Promise<boolean> {
    const existing = exitRecordsStore.find((r) => r.id === id || r.employeeId === id);
    if (!existing) return false;

    if (!AuthService.canModifyRecords(user, existing.plant) || user.role === 'PLANT_HR') {
      throw new Error(`Permission Denied: Only Corporate HR or HR Admin can delete records.`);
    }

    exitRecordsStore = exitRecordsStore.filter((r) => r.id !== existing.id);

    AuditService.logEvent('RECORD_DELETED', user, 'exit_record', {
      entityId: existing.id,
      plant: existing.plant,
      metadata: {
        employeeId: existing.employeeId,
      },
    });

    return true;
  }

  /**
   * Bulk import or replace records with batch tracking
   */
  static async importBatchRecords(
    user: AuthUser,
    params: {
      records: ExitRecord[];
      fileName: string;
      fileHash?: string;
      importMode: 'append' | 'replace';
      totalRows: number;
      validRows: number;
      invalidRows: number;
      warningCount: number;
    }
  ): Promise<{ batchId: string; affectedCount: number }> {
    if (!AuthService.canImportData(user)) {
      throw new Error(`Permission Denied: Role "${user.role}" does not have upload permissions.`);
    }

    if (params.importMode === 'replace' && !AuthService.canReplaceDataset(user)) {
      throw new Error(`Permission Denied: Only Corporate HR or HR Admin can replace the entire dataset.`);
    }

    // For Plant HR, verify that imported records only belong to their plant
    if (user.role === 'PLANT_HR' && user.assignedPlant) {
      const invalidPlantRecord = params.records.find(
        (r) => !AuthService.canAccessPlant(user, r.plant)
      );
      if (invalidPlantRecord) {
        throw new Error(
          `Security Rejection: Plant HR for "${user.assignedPlant}" cannot import record for plant "${invalidPlantRecord.plant}".`
        );
      }
    }

    // Create the batch entity
    const batch = ImportBatchService.createBatch(user, {
      fileName: params.fileName,
      fileHash: params.fileHash,
      totalRows: params.totalRows,
      validRows: params.validRows,
      invalidRows: params.invalidRows,
      warningCount: params.warningCount,
      importMode: params.importMode,
    });

    // Tag records with batch ID
    const taggedRecords = params.records.map((r) => ({ ...r, batchId: batch.id }));

    if (params.importMode === 'replace') {
      exitRecordsStore = taggedRecords;
      AuditService.logEvent('DATASET_REPLACED', user, 'dataset', {
        entityId: batch.id,
        metadata: {
          batchId: batch.id,
          fileName: params.fileName,
          totalRecords: taggedRecords.length,
        },
      });
    } else {
      // Append mode with duplicate employee ID resolution (latest wins)
      const map = new Map<string, ExitRecord>();
      exitRecordsStore.forEach((r) => map.set(r.employeeId.toUpperCase(), r));
      taggedRecords.forEach((r) => map.set(r.employeeId.toUpperCase(), r));
      exitRecordsStore = Array.from(map.values());
    }

    return {
      batchId: batch.id,
      affectedCount: taggedRecords.length,
    };
  }

  /**
   * Fetch aggregate analytics metrics strictly filtered by user authorization
   */
  static async getAnalyticsSummary(user: AuthUser, filters?: FilterState) {
    const { records } = await this.getExitRecords(user, filters);
    let headcounts = [...headcountStore];

    if (user.role === 'PLANT_HR' && user.assignedPlant) {
      headcounts = headcounts.filter(
        (h) => AuthService.canAccessPlant(user, h.plant)
      );
    }

    return calculateOverviewMetrics(records, headcounts);
  }

  /**
   * Headcount management
   */
  static async getHeadcounts(user: AuthUser): Promise<HeadcountConfig[]> {
    if (user.role === 'PLANT_HR' && user.assignedPlant) {
      return headcountStore.filter(
        (h) => AuthService.canAccessPlant(user, h.plant)
      );
    }
    return [...headcountStore];
  }

  /**
   * Reset store to initial demo state
   */
  static resetToDemoData() {
    exitRecordsStore = [...DEMO_EXIT_RECORDS];
    headcountStore = [...DEMO_HEADCOUNTS];
  }

  /**
   * Wipe all records (for testing empty states)
   */
  static clearAllData() {
    exitRecordsStore = [];
  }
}
