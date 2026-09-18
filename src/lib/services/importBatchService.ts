/**
 * Import Batch Lifecycle & Management Service
 * Manages batch entities, error registries, duplicate detection, and import retrospectives.
 */

import { AuthUser } from './authService';
import { AuditService } from './auditService';
import { ValidationErrorItem } from '../types';

export interface ImportBatch {
  id: string;
  fileName: string;
  fileHash?: string;
  uploadTimestamp: string;
  uploadedByUserId: string;
  uploadedByEmail: string;
  uploadedByRole: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningCount: number;
  importMode: 'append' | 'replace';
  status: 'pending' | 'completed' | 'failed' | 'partial';
  errorSummary?: string;
  errors: ValidationErrorItem[];
}

// Initial seed batch records representing enterprise operations history
const IN_MEMORY_BATCHES: ImportBatch[] = [
  {
    id: 'BATCH-2026-001',
    fileName: 'SSWL_Q1_ExitRegister_Chennai.xlsx',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploadTimestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    uploadedByUserId: 'usr-plant-chennai',
    uploadedByEmail: 'priya.sundaram@sswlindia.com',
    uploadedByRole: 'PLANT_HR',
    totalRows: 24,
    validRows: 24,
    invalidRows: 0,
    warningCount: 2,
    importMode: 'append',
    status: 'completed',
    errors: [],
  },
  {
    id: 'BATCH-2026-002',
    fileName: 'SSWL_Annual_Consolidated_2025.xlsx',
    fileHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    uploadTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    uploadedByUserId: 'usr-corp-01',
    uploadedByEmail: 'aman.sharma@sswlindia.com',
    uploadedByRole: 'CORP_HR',
    totalRows: 115,
    validRows: 115,
    invalidRows: 0,
    warningCount: 8,
    importMode: 'replace',
    status: 'completed',
    errors: [],
  },
  {
    id: 'BATCH-2026-003',
    fileName: 'Mehsana_Corrupted_Upload_Test.xlsx',
    fileHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    uploadTimestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    uploadedByUserId: 'usr-corp-01',
    uploadedByEmail: 'aman.sharma@sswlindia.com',
    uploadedByRole: 'CORP_HR',
    totalRows: 15,
    validRows: 12,
    invalidRows: 3,
    warningCount: 4,
    importMode: 'append',
    status: 'partial',
    errorSummary: '3 rows failed schema validation (missing mandatory Last Working Date).',
    errors: [
      {
        rowNumber: 4,
        employeeId: 'EMP-MEH-092',
        field: 'Last Working Date',
        message: 'Last working date is missing or invalid date format',
        severity: 'error',
      },
      {
        rowNumber: 7,
        employeeId: 'EMP-MEH-095',
        field: 'Primary Reason',
        message: 'Primary reason cannot be blank',
        severity: 'error',
      },
      {
        rowNumber: 11,
        employeeId: 'EMP-MEH-099',
        field: 'Chronology',
        message: 'Resignation date is after Last Working Date',
        severity: 'error',
      },
    ],
  },
];

export class ImportBatchService {
  /**
   * Check if an identical batch was uploaded recently to prevent accidental duplicate imports
   */
  static isDuplicateBatch(fileName: string, totalRows: number, fileHash?: string): { isDuplicate: boolean; previousBatch?: ImportBatch } {
    const match = IN_MEMORY_BATCHES.find(
      (b) =>
        (fileHash && b.fileHash === fileHash) ||
        (b.fileName.toLowerCase() === fileName.toLowerCase() && b.totalRows === totalRows && b.status === 'completed')
    );

    if (match) {
      return { isDuplicate: true, previousBatch: match };
    }
    return { isDuplicate: false };
  }

  /**
   * Create a new pending import batch
   */
  static createBatch(
    user: AuthUser,
    params: {
      fileName: string;
      fileHash?: string;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      warningCount: number;
      importMode: 'append' | 'replace';
      errors?: ValidationErrorItem[];
    }
  ): ImportBatch {
    AuditService.logEvent('IMPORT_INITIATED', user, 'import_batch', {
      metadata: {
        fileName: params.fileName,
        totalRows: params.totalRows,
        importMode: params.importMode,
      },
    });

    const status: ImportBatch['status'] =
      params.invalidRows === 0
        ? 'completed'
        : params.validRows > 0
        ? 'partial'
        : 'failed';

    const batch: ImportBatch = {
      id: `BATCH-${Date.now().toString().slice(-6)}`,
      fileName: params.fileName,
      fileHash: params.fileHash,
      uploadTimestamp: new Date().toISOString(),
      uploadedByUserId: user.id,
      uploadedByEmail: user.email,
      uploadedByRole: user.role,
      totalRows: params.totalRows,
      validRows: params.validRows,
      invalidRows: params.invalidRows,
      warningCount: params.warningCount,
      importMode: params.importMode,
      status,
      errorSummary:
        params.invalidRows > 0
          ? `${params.invalidRows} rows failed validation checks.`
          : undefined,
      errors: params.errors || [],
    };

    IN_MEMORY_BATCHES.unshift(batch);

    // Audit completion or failure
    AuditService.logEvent(
      status === 'failed' ? 'IMPORT_FAILED' : 'IMPORT_COMPLETED',
      user,
      'import_batch',
      {
        entityId: batch.id,
        metadata: {
          batchId: batch.id,
          fileName: batch.fileName,
          totalRows: batch.totalRows,
          validRows: batch.validRows,
          invalidRows: batch.invalidRows,
          warningCount: batch.warningCount,
          importMode: batch.importMode,
          status,
        },
      }
    );

    return batch;
  }

  /**
   * Retrieve batch history based on user permissions
   */
  static getBatchHistory(user: AuthUser): ImportBatch[] {
    if (user.role === 'PLANT_HR' && user.assignedPlant) {
      // Return batches uploaded by this user or explicitly tagged to plant
      return IN_MEMORY_BATCHES.filter(
        (b) =>
          b.uploadedByEmail === user.email ||
          b.fileName.toLowerCase().includes(user.assignedPlant!.toLowerCase())
      );
    }
    return [...IN_MEMORY_BATCHES];
  }

  /**
   * Get single batch detail with error breakdown
   */
  static getBatchById(batchId: string): ImportBatch | undefined {
    return IN_MEMORY_BATCHES.find((b) => b.id === batchId);
  }
}
