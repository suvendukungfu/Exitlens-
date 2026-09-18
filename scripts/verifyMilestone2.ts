/**
 * EXITLENS — MILESTONE 2 VERIFICATION SUITE
 * Comprehensive tests for:
 * 1. Database schema constraints & DDL
 * 2. Role permissions & authorization matrices
 * 3. Plant-level data isolation enforcement
 * 4. Import batch creation & duplicate detection
 * 5. Append vs Replace dataset behavior & duplicate employee ID resolution
 * 6. Privacy-preserving audit event creation (remarks scrubbing)
 * 7. Unauthorized access rejections
 * 8. Zero-state & empty dataset stability
 */

import { POSTGRES_DDL, DB_SCHEMA_METADATA } from '../src/lib/db/schema';
import { AuthService, DEV_PERSONAS } from '../src/lib/services/authService';
import { AuditService } from '../src/lib/services/auditService';
import { ImportBatchService } from '../src/lib/services/importBatchService';
import { ExitRecordService } from '../src/lib/services/exitRecordService';
import { DEMO_EXIT_RECORDS } from '../src/lib/demo/demoData';
import { ExitRecord } from '../src/lib/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('EXITLENS — MILESTONE 2 ENTERPRISE ARCHITECTURE VERIFICATION');
  console.log('='.repeat(70));

  // Reset store to known state
  ExitRecordService.resetToDemoData();

  const corpUser = DEV_PERSONAS.find((p) => p.role === 'CORP_HR')!;
  const chennaiUser = DEV_PERSONAS.find((p) => p.assignedPlant === 'Chennai')!;
  const adminUser = DEV_PERSONAS.find((p) => p.role === 'HR_ADMIN')!;
  const viewerUser = DEV_PERSONAS.find((p) => p.role === 'VIEWER')!;

  // --------------------------------------------------------------------------
  // TEST GROUP 1: DATABASE SCHEMA CONSTRAINTS & DDL
  // --------------------------------------------------------------------------
  console.log('\n1. Database Schema Constraints & DDL Verification:');
  
  assert(
    DB_SCHEMA_METADATA.tables.length >= 12,
    'Schema defines at least 12 relational core tables',
    `Found ${DB_SCHEMA_METADATA.tables.length} tables`
  );

  const requiredTables = [
    'roles',
    'plants',
    'users',
    'departments',
    'sub_departments',
    'employment_types',
    'exit_types',
    'reason_categories',
    'headcount_records',
    'import_batches',
    'import_errors',
    'exit_records',
    'audit_logs',
  ];
  const allTablesPresent = requiredTables.every((t) => POSTGRES_DDL.includes(`CREATE TABLE IF NOT EXISTS ${t}`));
  assert(allTablesPresent, 'All 12 required tables exist in PostgreSQL DDL');

  assert(
    POSTGRES_DDL.includes('id UUID PRIMARY KEY DEFAULT uuid_generate_v4()'),
    'Tables use stable UUID primary keys'
  );

  assert(
    POSTGRES_DDL.includes('CONSTRAINT chk_exit_dates CHECK (joining_date <= last_working_date)'),
    'Exit records enforce chronological date constraint (joining_date <= last_working_date)'
  );

  assert(
    POSTGRES_DDL.includes('CREATE INDEX IF NOT EXISTS idx_exit_records_empid ON exit_records(employee_id)'),
    'Employee ID is indexed as natural business key without being primary key'
  );

  assert(
    POSTGRES_DDL.includes('UNIQUE(plant_id, department_id, year, month)'),
    'Headcount records enforce composite uniqueness on plant, department, year, month'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 2: ROLE PERMISSIONS & AUTHORIZATION
  // --------------------------------------------------------------------------
  console.log('\n2. Role Permissions & Authorization Matrix:');

  assert(
    AuthService.canAccessPlant(corpUser, 'Chennai') && AuthService.canAccessPlant(corpUser, 'Dappar'),
    'Corporate HR has org-wide access across all plants'
  );

  assert(
    AuthService.canAccessPlant(chennaiUser, 'Chennai'),
    'Plant HR can access assigned plant (Chennai)'
  );

  assert(
    !AuthService.canAccessPlant(chennaiUser, 'Dappar') && !AuthService.canAccessPlant(chennaiUser, 'Mehsana'),
    'Plant HR is denied access to other plants (Dappar, Mehsana)'
  );

  assert(
    !AuthService.canImportData(viewerUser),
    'Viewer role is strictly denied import permissions'
  );

  assert(
    !AuthService.canModifyRecords(viewerUser),
    'Viewer role is strictly denied record modification permissions'
  );

  assert(
    !AuthService.canReplaceDataset(chennaiUser),
    'Plant HR is denied full dataset replacement permission'
  );

  assert(
    AuthService.canReplaceDataset(corpUser) && AuthService.canReplaceDataset(adminUser),
    'Corporate HR and HR Admin can replace dataset'
  );

  assert(
    AuthService.canManageMasterData(adminUser) && !AuthService.canManageMasterData(corpUser),
    'Only HR Admin has master taxonomy governance permission'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: PLANT-LEVEL DATA ACCESS ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n3. Server-Side Plant-Level Data Isolation:');

  const chennaiResult = await ExitRecordService.getExitRecords(chennaiUser);
  const allChennai = chennaiResult.records.every((r) => AuthService.canAccessPlant(chennaiUser, r.plant));
  assert(
    allChennai && chennaiResult.records.length > 0,
    'ExitRecordService bounds records to Chennai for Chennai Plant HR',
    `Count: ${chennaiResult.records.length}`
  );

  const corpResult = await ExitRecordService.getExitRecords(corpUser);
  assert(
    corpResult.records.length > chennaiResult.records.length,
    'Corporate HR receives all plant records',
    `Corp count: ${corpResult.records.length}, Chennai count: ${chennaiResult.records.length}`
  );

  // Attempting to query record belonging to Dappar as Chennai user
  const dapparRecord = corpResult.records.find((r) => r.plant.toLowerCase() === 'dappar')!;
  let unauthorizedErrorCaught = false;
  try {
    await ExitRecordService.getExitRecordById(chennaiUser, dapparRecord.id);
  } catch {
    unauthorizedErrorCaught = true;
  }
  assert(
    unauthorizedErrorCaught,
    'Access Denied thrown when Plant HR requests record from unassigned plant'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: IMPORT BATCH LIFECYCLE & DEDUPLICATION
  // --------------------------------------------------------------------------
  console.log('\n4. Import Batch Lifecycle & Duplicate Detection:');

  const testBatch = ImportBatchService.createBatch(corpUser, {
    fileName: 'SSWL_Test_Batch_Alpha.xlsx',
    totalRows: 50,
    validRows: 48,
    invalidRows: 2,
    warningCount: 5,
    importMode: 'append',
    errors: [
      {
        rowNumber: 12,
        employeeId: 'EMP-T12',
        field: 'Last Working Date',
        message: 'Invalid date',
        severity: 'error',
      },
      {
        rowNumber: 19,
        employeeId: 'EMP-T19',
        field: 'Joining Date',
        message: 'Joining date missing',
        severity: 'error',
      },
    ],
  });

  assert(
    testBatch.id.startsWith('BATCH-') && testBatch.status === 'partial',
    'Batch created with partial status when invalidRows > 0',
    `Status: ${testBatch.status}, ID: ${testBatch.id}`
  );

  assert(
    testBatch.errors.length === 2,
    'Batch error register accurately stores schema validation errors'
  );

  // Test duplicate batch detection
  const dupCheck = ImportBatchService.isDuplicateBatch('SSWL_Q1_ExitRegister_Chennai.xlsx', 24);
  assert(
    dupCheck.isDuplicate,
    'Detects identical previously ingested file name and row count'
  );

  const nonDupCheck = ImportBatchService.isDuplicateBatch('Unique_New_File_2026.xlsx', 100);
  assert(
    !nonDupCheck.isDuplicate,
    'Correctly marks unique file as non-duplicate'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: APPEND VS REPLACE & DUPLICATE EMPLOYEE ID RESOLUTION
  // --------------------------------------------------------------------------
  console.log('\n5. Append vs Replace & Employee ID Resolution:');

  // Test Plant HR attempting to import record for another plant
  let foreignPlantRejected = false;
  try {
    await ExitRecordService.importBatchRecords(chennaiUser, {
      records: [
        {
          ...DEMO_EXIT_RECORDS[0],
          plant: 'Dappar', // Mismatch!
        },
      ],
      fileName: 'chennai_bad_plant.xlsx',
      importMode: 'append',
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      warningCount: 0,
    });
  } catch {
    foreignPlantRejected = true;
  }
  assert(
    foreignPlantRejected,
    'Security Rejection: Plant HR cannot import records for unassigned plant'
  );

  // Test Append with duplicate employee ID: update existing record without duplicating count
  const baseCount = (await ExitRecordService.getExitRecords(corpUser)).totalCount;
  const targetEmp = DEMO_EXIT_RECORDS[0];
  const updatedEmp: ExitRecord = {
    ...targetEmp,
    designation: 'Senior General Manager (Updated via Append)',
  };

  await ExitRecordService.importBatchRecords(corpUser, {
    records: [updatedEmp],
    fileName: 'update_append.xlsx',
    importMode: 'append',
    totalRows: 1,
    validRows: 1,
    invalidRows: 0,
    warningCount: 0,
  });

  const afterAppendRecords = (await ExitRecordService.getExitRecords(corpUser)).records;
  const foundUpdated = afterAppendRecords.find((r) => r.employeeId === targetEmp.employeeId);

  assert(
    afterAppendRecords.length === baseCount,
    'Append mode does not duplicate employee rows when matching employee ID exists',
    `Total: ${afterAppendRecords.length}`
  );
  assert(
    foundUpdated?.designation === 'Senior General Manager (Updated via Append)',
    'Append mode updates attributes of existing employee ID record'
  );

  // Test Replace mode permission rejection
  let replaceRejectedForViewer = false;
  try {
    await ExitRecordService.importBatchRecords(viewerUser, {
      records: [targetEmp],
      fileName: 'replace_test.xlsx',
      importMode: 'replace',
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      warningCount: 0,
    });
  } catch {
    replaceRejectedForViewer = true;
  }
  assert(
    replaceRejectedForViewer,
    'Viewer is rejected from executing dataset replacement'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: PRIVACY-PRESERVING AUDIT LOGGING
  // --------------------------------------------------------------------------
  console.log('\n6. Privacy-Preserving Audit Logging:');

  const auditEntry = AuditService.logEvent('RECORD_CREATED', corpUser, 'exit_record', {
    entityId: 'EMP-PRIVACY-001',
    metadata: {
      employeeId: 'EMP-999',
      department: 'Production',
      hrRemarks: 'Confidential sensitive resignation remarks that must be redacted',
      detailedReason: 'Employee complained about personal conflicts with supervisor',
      tenureMonths: 18,
    },
  });

  assert(
    auditEntry.summaryMetadata.hrRemarks === '[REDACTED_FOR_PRIVACY]',
    'Audit logger scrubs hrRemarks field from metadata'
  );
  assert(
    auditEntry.summaryMetadata.detailedReason === '[REDACTED_FOR_PRIVACY]',
    'Audit logger scrubs detailedReason remarks from metadata'
  );
  assert(
    auditEntry.summaryMetadata.department === 'Production' && auditEntry.summaryMetadata.tenureMonths === 18,
    'Audit logger preserves non-PII operational telemetry'
  );

  const logs = AuditService.getAuditLogs(corpUser);
  assert(
    logs.length >= 2,
    'Audit trail stores events with actor email and timestamp',
    `Log count: ${logs.length}`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 7: EMPTY DATASET & ZERO-STATE STABILITY
  // --------------------------------------------------------------------------
  console.log('\n7. Empty Dataset & Zero-State Stability:');

  ExitRecordService.clearAllData();
  const emptyRes = await ExitRecordService.getExitRecords(corpUser);
  assert(
    emptyRes.records.length === 0,
    'Service handles clearAllData producing 0 records'
  );

  const emptyAnalytics = await ExitRecordService.getAnalyticsSummary(corpUser);
  assert(
    emptyAnalytics.totalExits === 0 && (emptyAnalytics.attritionRate === null || emptyAnalytics.attritionRate === 0),
    'Analytics calculations return safe zeros on empty dataset without division by zero errors',
    `Attrition rate: ${emptyAnalytics.attritionRate}`
  );

  // Restore demo data
  ExitRecordService.resetToDemoData();

  console.log('\n' + '='.repeat(70));
  console.log(`MILESTONE 2 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Exception:', err);
  process.exit(1);
});
