import { validateUploadedRows } from '../src/lib/validation/excelSchema';
import { RawExcelRow, ExitRecord } from '../src/lib/types';
import { INITIAL_MASTER_DATA } from '../src/lib/constants/masterData';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('    EXCEL IMPORT & SCHEMA RIGOROUS AUDIT SUITE       ');
console.log('======================================================\n');

// 1. Empty File Check
console.log('1. Testing Empty File & Empty Rows:');
const emptyResult = validateUploadedRows([]);
assert(
  emptyResult.isValid === false && emptyResult.errors.length > 0,
  'Empty file triggers validation failure and error report'
);

const emptyRows: RawExcelRow[] = [
  {},
  { 'Employee ID': '', 'Plant / Location': '   ' },
];
const emptyRowsResult = validateUploadedRows(emptyRows);
assert(
  emptyRowsResult.validRows === 0 && emptyRowsResult.totalRows === 0,
  'Completely blank rows are safely skipped without generating spurious error rows'
);

// 2. Missing Required Columns
console.log('\n2. Testing Missing Required Fields:');
const missingColsRow: RawExcelRow[] = [
  {
    'Employee Name': 'John Doe',
    // Missing 'Employee ID'
    // Missing 'Department'
    // Missing 'Plant / Location'
    'Joining Date': '2024-01-01',
    'Last Working Date': '2025-01-01',
    'Exit Type': 'Voluntary Resignation',
    'Primary Exit Reason': 'Better Compensation',
  },
];
const missingResult = validateUploadedRows(missingColsRow);
assert(
  missingResult.errors.some((e) => e.field === 'Employee ID'),
  'Flags missing mandatory Employee ID'
);
assert(
  missingResult.errors.some((e) => e.field === 'Department'),
  'Flags missing mandatory Department'
);
assert(
  missingResult.errors.some((e) => e.field === 'Plant / Location'),
  'Flags missing mandatory Plant / Location'
);
assert(
  missingResult.validRows === 0 && missingResult.errorRows === 1,
  'Row with missing mandatory fields is rejected from valid import rows'
);

// 3. Chronological Error (Joining Date after Exit Date)
console.log('\n3. Testing Chronological Integrity:');
const invertedChronologyRow: RawExcelRow[] = [
  {
    'Employee ID': 'SSW-ERR-01',
    'Employee Name': 'Chronology Error Test',
    'Plant / Location': 'Dappar (Punjab)',
    'Department': 'Production / Shop Floor',
    'Joining Date': '2025-06-01',
    'Last Working Date': '2025-01-01', // Exit BEFORE joining!
    'Exit Type': 'Voluntary Resignation',
    'Primary Exit Reason': 'Better Compensation',
  },
];
const chronologyResult = validateUploadedRows(invertedChronologyRow);
assert(
  chronologyResult.errors.some((e) => e.field === 'Chronology'),
  'Flags inverted chronology error when Joining Date is after Exit Date'
);
assert(
  chronologyResult.validRows === 0,
  'Inverted chronological row is blocked from valid parsed records'
);

// 4. Duplicate ID Handling (Within File and Against System)
console.log('\n4. Testing Duplicate Employee ID Detection:');
const duplicateInFileRows: RawExcelRow[] = [
  {
    'Employee ID': 'SSW-DUP-01',
    'Employee Name': 'Original Row',
    'Plant / Location': 'Dappar (Punjab)',
    'Department': 'Production / Shop Floor',
    'Joining Date': '2024-01-01',
    'Last Working Date': '2025-01-01',
    'Exit Type': 'Voluntary Resignation',
    'Primary Exit Reason': 'Better Compensation',
  },
  {
    'Employee ID': 'SSW-DUP-01', // Duplicate!
    'Employee Name': 'Duplicate Row',
    'Plant / Location': 'Dappar (Punjab)',
    'Department': 'Production / Shop Floor',
    'Joining Date': '2024-01-01',
    'Last Working Date': '2025-01-01',
    'Exit Type': 'Voluntary Resignation',
    'Primary Exit Reason': 'Better Compensation',
  },
];
const dupFileResult = validateUploadedRows(duplicateInFileRows);
assert(
  dupFileResult.errors.some((e) => e.field === 'Employee ID' && e.message.includes('Duplicate')),
  'Detects duplicate Employee ID within same uploaded spreadsheet'
);
assert(
  dupFileResult.validRows === 1 && dupFileResult.errorRows === 1,
  'First unique row is accepted, second duplicate row is rejected'
);

// Existing system collision
const existingDummy: ExitRecord[] = [
  {
    id: 'REC-EXISTING',
    employeeId: 'SSW-EXISTING-99',
    employeeName: 'Existing Worker',
    plant: 'Dappar (Punjab)',
    department: 'Production / Shop Floor',
    subDepartment: 'Rim Line',
    employmentType: 'Permanent / On-Roll',
    designation: 'Operator',
    joiningDate: '2023-01-01',
    lastWorkingDate: '2024-01-01',
    exitType: 'Voluntary Resignation',
    primaryReason: 'Better Compensation',
    tenureMonths: 12,
    tenureYears: 1.0,
    tenureBucket: '1–2 years',
  },
];
const existingCollisionRow: RawExcelRow[] = [
  {
    'Employee ID': 'SSW-EXISTING-99',
    'Employee Name': 'Updated Worker Name',
    'Plant / Location': 'Dappar (Punjab)',
    'Department': 'Production / Shop Floor',
    'Joining Date': '2023-01-01',
    'Last Working Date': '2024-01-01',
    'Exit Type': 'Voluntary Resignation',
    'Primary Exit Reason': 'Better Compensation',
  },
];
const collisionResult = validateUploadedRows(existingCollisionRow, existingDummy);
assert(
  collisionResult.warnings.some((w) => w.employeeId === 'SSW-EXISTING-99' && w.severity === 'warning'),
  'Emits warning when uploaded ID matches existing record in system (reconciliation alert)'
);
assert(
  collisionResult.validRows === 1,
  'Record is preserved as valid for merge/update in Append mode'
);

// 5. Taxonomy & Validation Warnings
console.log('\n5. Testing Master Taxonomy & Value Checks:');
const taxonomyCheckRow: RawExcelRow[] = [
  {
    'Employee ID': 'SSW-TAX-01',
    'Employee Name': 'Taxonomy Test',
    'Plant / Location': 'Unknown Alien Facility', // Non-standard plant
    'Department': 'Experimental Science Unit', // Non-standard dept
    'Joining Date': '2024-01-01',
    'Last Working Date': '2025-01-01',
    'Exit Type': 'Alien Abduction', // Non-standard exit type
    'Primary Exit Reason': 'Intergalactic Relocation', // Non-standard reason
    'Replacement Required': 'Maybe / Unsure', // Invalid Yes/No
  },
];
const taxonomyResult = validateUploadedRows(taxonomyCheckRow, [], INITIAL_MASTER_DATA);
assert(
  taxonomyResult.warnings.some((w) => w.field === 'Plant / Location'),
  'Emits warning for unrecognized manufacturing plant facility'
);
assert(
  taxonomyResult.warnings.some((w) => w.field === 'Department'),
  'Emits warning for non-standard organizational department'
);
assert(
  taxonomyResult.warnings.some((w) => w.field === 'Exit Type'),
  'Emits warning for non-standard Exit Type'
);
assert(
  taxonomyResult.warnings.some((w) => w.field === 'Primary Exit Reason'),
  'Emits warning for non-standard Primary Exit Reason'
);
assert(
  taxonomyResult.warnings.some((w) => w.field === 'Replacement Required'),
  'Emits warning for non-standard Yes/No field value ("Maybe / Unsure")'
);

console.log('\n======================================================');
console.log(`EXCEL AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
