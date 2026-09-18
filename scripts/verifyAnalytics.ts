import {
  calculateTenure,
  calculateOverviewMetrics,
  calculateMonthlyTrend,
  calculateQuarterlyTrend,
  calculateDepartmentExits,
  calculatePlantExits,
  calculateReasonDistribution,
  calculateTenureBuckets,
  calculateExitTypes,
  calculateReasonByDepartmentMatrix,
  calculateReasonByPlantMatrix,
  calculateMonthlyReasonComposition,
} from '../src/lib/analytics/calculations';
import { filterRecords, INITIAL_FILTER_STATE } from '../src/lib/analytics/filters';
import {
  SYNTHETIC_TEST_RECORDS,
  SYNTHETIC_TEST_HEADCOUNTS,
  GROUND_TRUTH_EXPECTATIONS,
} from '../src/lib/demo/testDataset';

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
console.log('   EXITLENS RIGOROUS PRODUCTION VERIFICATION SUITE    ');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// 1. Core Overview Metrics Verification
// ---------------------------------------------------------------------------
console.log('1. Auditing Core Overview Metrics:');
const metrics = calculateOverviewMetrics(SYNTHETIC_TEST_RECORDS, SYNTHETIC_TEST_HEADCOUNTS);

assert(
  metrics.totalExits === GROUND_TRUTH_EXPECTATIONS.totalCount,
  'Total Exit Count',
  `Expected ${GROUND_TRUTH_EXPECTATIONS.totalCount}, got ${metrics.totalExits}`
);

assert(
  metrics.voluntaryExits === GROUND_TRUTH_EXPECTATIONS.voluntaryCount,
  'Voluntary Exit Count',
  `Expected ${GROUND_TRUTH_EXPECTATIONS.voluntaryCount}, got ${metrics.voluntaryExits}`
);

assert(
  metrics.involuntaryExits === GROUND_TRUTH_EXPECTATIONS.involuntaryCount,
  'Involuntary Exit Count',
  `Expected ${GROUND_TRUTH_EXPECTATIONS.involuntaryCount}, got ${metrics.involuntaryExits}`
);

assert(
  metrics.voluntaryPercentage === 75.0,
  'Voluntary Percentage is 75.0%',
  `Expected 75.0%, got ${metrics.voluntaryPercentage}%`
);

assert(
  metrics.mostCommonReason.reason === 'Better Compensation' && metrics.mostCommonReason.count === 2,
  'Most Common Reason is Better Compensation (2 exits)',
  `Got ${metrics.mostCommonReason.reason} (${metrics.mostCommonReason.count})`
);

// ---------------------------------------------------------------------------
// 2. Monthly & Quarterly Aggregations
// ---------------------------------------------------------------------------
console.log('\n2. Auditing Monthly & Quarterly Aggregations:');
const monthly = calculateMonthlyTrend(SYNTHETIC_TEST_RECORDS);

const monthlyMap: Record<string, number> = {};
monthly.forEach((m) => {
  monthlyMap[m.month] = m.count;
});

assert(
  monthlyMap['2025-01'] === GROUND_TRUTH_EXPECTATIONS.monthlyCounts['2025-01'],
  'January 2025 Exits = 3',
  `Got ${monthlyMap['2025-01']}`
);
assert(
  monthlyMap['2025-02'] === GROUND_TRUTH_EXPECTATIONS.monthlyCounts['2025-02'],
  'February 2025 Exits = 4',
  `Got ${monthlyMap['2025-02']}`
);
assert(
  monthlyMap['2025-03'] === GROUND_TRUTH_EXPECTATIONS.monthlyCounts['2025-03'],
  'March 2025 Exits = 5',
  `Got ${monthlyMap['2025-03']}`
);

const quarterly = calculateQuarterlyTrend(SYNTHETIC_TEST_RECORDS);
const q1 = quarterly.find((q) => q.quarter === '2025-Q1');
assert(
  q1?.count === GROUND_TRUTH_EXPECTATIONS.quarterlyCounts['2025-Q1'],
  'Quarterly 2025-Q1 Exits = 12',
  `Got ${q1?.count}`
);

// ---------------------------------------------------------------------------
// 3. Department & Plant Aggregations
// ---------------------------------------------------------------------------
console.log('\n3. Auditing Department & Plant Aggregations:');
const deptData = calculateDepartmentExits(SYNTHETIC_TEST_RECORDS);
const prodDept = deptData.find((d) => d.name === 'Production / Shop Floor');
assert(
  prodDept?.count === GROUND_TRUTH_EXPECTATIONS.departmentCounts['Production / Shop Floor'],
  'Production / Shop Floor Exits = 5',
  `Got ${prodDept?.count}`
);

const plantData = calculatePlantExits(SYNTHETIC_TEST_RECORDS);
const dapparPlant = plantData.find((p) => p.name === 'Dappar (Punjab)');
const jmsPlant = plantData.find((p) => p.name === 'Jamshedpur (Jharkhand)');
const chnPlant = plantData.find((p) => p.name === 'Chennai (Tamil Nadu)');
assert(dapparPlant?.count === 3, 'Dappar Exits = 3', `Got ${dapparPlant?.count}`);
assert(jmsPlant?.count === 3, 'Jamshedpur Exits = 3', `Got ${jmsPlant?.count}`);
assert(chnPlant?.count === 2, 'Chennai Exits = 2', `Got ${chnPlant?.count}`);

// ---------------------------------------------------------------------------
// 4. Reason Aggregations & Matrices
// ---------------------------------------------------------------------------
console.log('\n4. Auditing Reason Aggregations & Cross Matrices:');
const reasons = calculateReasonDistribution(SYNTHETIC_TEST_RECORDS);
const betterComp = reasons.find((r) => r.name === 'Better Compensation');
assert(betterComp?.count === 2, 'Better Compensation = 2 exits', `Got ${betterComp?.count}`);

const undisclosed = reasons.find((r) => r.name === 'Unknown / Not Disclosed');
assert(undisclosed?.count === 1, 'Unknown / Not Disclosed = 1 exit', `Got ${undisclosed?.count}`);

const reasonDeptMatrix = calculateReasonByDepartmentMatrix(SYNTHETIC_TEST_RECORDS);
assert(reasonDeptMatrix.rows.length > 0, 'Reason-Department Matrix generated rows (reasons)');
assert(reasonDeptMatrix.columns.includes('Production / Shop Floor'), 'Matrix contains Production column');

const reasonPlantMatrix = calculateReasonByPlantMatrix(SYNTHETIC_TEST_RECORDS);
assert(reasonPlantMatrix.columns.includes('Dappar (Punjab)'), 'Matrix contains Dappar column');

const reasonComposition = calculateMonthlyReasonComposition(SYNTHETIC_TEST_RECORDS);
assert(reasonComposition.length === 3, 'Monthly Reason Composition covers 3 months (Jan-Mar)');

const tenureBuckets = calculateTenureBuckets(SYNTHETIC_TEST_RECORDS);
assert(tenureBuckets.length === 6, 'Generated all 6 tenure bucket intervals');
const earlyBucket = tenureBuckets.find((b) => b.bucket === '0–3 months');
assert(earlyBucket !== undefined && earlyBucket.count >= 1, 'Tenure bucket 0–3 months contains early exits');

const exitTypes = calculateExitTypes(SYNTHETIC_TEST_RECORDS);
assert(exitTypes.length >= 3, 'Calculated exit type distribution categories');
const volExitType = exitTypes.find((e) => e.name === 'Voluntary Resignation');
assert(volExitType?.count === 9, 'Voluntary Resignation count matches 9 in Exit Types distribution');

// ---------------------------------------------------------------------------
// 5. Tenure Logic & Edge Case Assertions
// ---------------------------------------------------------------------------
console.log('\n5. Auditing Tenure Calculation Rules & Edge Cases:');

// Rule: (LWD || Resignation Date) - Joining Date
// Case A: Same-month joining & exit (2025-01-05 to 2025-01-30 = 25 days)
const tSameMonth = calculateTenure('2025-01-05', '2025-01-30', '2025-01-20');
assert(
  tSameMonth.tenureBucket === '0–3 months' && tSameMonth.tenureMonths === 0.8 && tSameMonth.tenureYears === 0.1,
  'Same-month tenure: 25 days -> 0.8 months, 0.1 years, bucket 0–3 months'
);

// Case B: Exactly one-year across leap year (2024-02-01 to 2025-02-01 = 366 days)
const tLeapYear = calculateTenure('2024-02-01', '2025-02-01');
assert(
  tLeapYear.tenureYears === 1.0 && tLeapYear.tenureBucket === '1–2 years',
  'One-year tenure across leap year -> 1.0 years, bucket 1–2 years'
);

// Case C: Leap year date leap day (2024-02-29 to 2025-02-28 = 365 days)
const tLeapDay = calculateTenure('2024-02-29', '2025-02-28');
assert(
  tLeapDay.tenureYears === 1.0 && tLeapDay.tenureBucket === '6–12 months',
  'Leap day joining 2024-02-29 to 2025-02-28 -> 365 days, bucket 6–12 months'
);

// Case D: Missing Last Working Date (Fallback to Resignation Date)
const tFallback = calculateTenure('2024-06-01', undefined, '2025-02-15');
assert(
  tFallback.tenureYears === 0.7 && tFallback.tenureBucket === '6–12 months',
  'Missing LWD properly falls back to Resignation Date'
);

// Case E: Missing Resignation Date with valid LWD
const tValidLwd = calculateTenure('2022-03-01', '2025-02-28', undefined);
assert(
  tValidLwd.tenureYears === 3.0 && tValidLwd.tenureBucket === '2–5 years',
  'Missing Resignation Date uses valid LWD -> 3.0 years'
);

// Case F: Missing both exit dates
const tMissingBoth = calculateTenure('2024-01-01', undefined, undefined);
assert(
  tMissingBoth.tenureYears === 0 && tMissingBoth.tenureMonths === 0 && tMissingBoth.tenureBucket === '0–3 months',
  'Missing both exit dates returns safe 0 tenure'
);

// Case G: Invalid joining date string
const tInvalidStart = calculateTenure('invalid-date-string', '2025-01-15');
assert(
  tInvalidStart.tenureYears === 0 && tInvalidStart.tenureMonths === 0,
  'Invalid joining date string returns safe 0 tenure without NaN'
);

// Case H: Exit date earlier than joining date (inverted chronological order)
const tInverted = calculateTenure('2025-06-01', '2024-01-01');
assert(
  tInverted.tenureYears === 0 && tInverted.tenureMonths === 0,
  'Inverted dates (exit before joining) returns 0 and does NOT produce negative numbers'
);

// ---------------------------------------------------------------------------
// 6. Attrition Rate Logic Verification
// ---------------------------------------------------------------------------
console.log('\n6. Auditing Attrition Rate Rules:');

// Rule: Never label raw exit count as attrition rate! Requires headcount.
// Case A: Missing headcount
const metricsNoHeadcount = calculateOverviewMetrics(SYNTHETIC_TEST_RECORDS, undefined);
assert(
  metricsNoHeadcount.attritionRate === null && metricsNoHeadcount.headcountAvailable === false,
  'Missing headcount returns attritionRate = null and headcountAvailable = false'
);

// Case B: Empty headcount array
const metricsEmptyHeadcount = calculateOverviewMetrics(SYNTHETIC_TEST_RECORDS, []);
assert(
  metricsEmptyHeadcount.attritionRate === null && metricsEmptyHeadcount.headcountAvailable === false,
  'Empty headcount array returns attritionRate = null'
);

// Case C: Zero headcount handling
const zeroHeadcount = [{ plant: 'All', department: 'All', year: 2025, month: 1, headcount: 0 }];
const metricsZeroHeadcount = calculateOverviewMetrics(SYNTHETIC_TEST_RECORDS, zeroHeadcount);
assert(
  metricsZeroHeadcount.attritionRate === null && metricsZeroHeadcount.headcountAvailable === false,
  'Zero headcount returns safe null without division by zero'
);

// Case D: Valid Organization Headcount (Total Exits = 12, Total Headcount = 6100)
// Formula: (12 / 6100) * 100 = 0.196... -> 0.2%
assert(
  metrics.attritionRate === 0.2 && metrics.headcountAvailable === true,
  'Valid organization headcount calculates attrition rate = 0.2%',
  `Got ${metrics.attritionRate}%`
);

// Case E: Plant-level filtered attrition calculation (Chennai: 2 exits, 1200 headcount -> 0.2%)
const chennaiRecords = SYNTHETIC_TEST_RECORDS.filter((r) => r.plant === 'Chennai (Tamil Nadu)');
const chennaiMetrics = calculateOverviewMetrics(chennaiRecords, SYNTHETIC_TEST_HEADCOUNTS);
assert(
  chennaiMetrics.attritionRate === 0.2 && chennaiMetrics.headcountAvailable === true,
  'Plant-filtered attrition rate aligns with plant headcount (2 / 1200 * 100 = 0.2%)',
  `Got ${chennaiMetrics.attritionRate}%`
);

// ---------------------------------------------------------------------------
// 7. Multi-Dimensional Filter Consistency
// ---------------------------------------------------------------------------
console.log('\n7. Auditing Filter Consistency:');

// Filter by Plant: Dappar
const filteredByPlant = filterRecords(SYNTHETIC_TEST_RECORDS, {
  ...INITIAL_FILTER_STATE,
  plant: ['Dappar (Punjab)'],
});
assert(filteredByPlant.length === 3, 'Filter by Plant (Dappar) returns exactly 3 records');

// Filter by Department: Production / Shop Floor
const filteredByDept = filterRecords(SYNTHETIC_TEST_RECORDS, {
  ...INITIAL_FILTER_STATE,
  department: ['Production / Shop Floor'],
});
assert(filteredByDept.length === 5, 'Filter by Dept (Production) returns exactly 5 records');

// Combined Filter: Dappar + Production
const filteredDapparProd = filterRecords(SYNTHETIC_TEST_RECORDS, {
  ...INITIAL_FILTER_STATE,
  plant: ['Dappar (Punjab)'],
  department: ['Production / Shop Floor'],
});
assert(filteredDapparProd.length === 2, 'Combined Filter (Dappar + Production) returns exactly 2 records');

// Search Query Filter
const filteredSearch = filterRecords(SYNTHETIC_TEST_RECORDS, {
  ...INITIAL_FILTER_STATE,
  searchQuery: 'Lambda',
});
assert(
  filteredSearch.length === 1 && filteredSearch[0].employeeId === 'TEST-EMP-111',
  'Search Query "Lambda" returns exactly 1 record (TEST-EMP-111)'
);

// Date Range Filter
const filteredDate = filterRecords(SYNTHETIC_TEST_RECORDS, {
  ...INITIAL_FILTER_STATE,
  dateRange: { start: '2025-01-01', end: '2025-01-31', preset: 'CUSTOM' },
});
assert(filteredDate.length === 3, 'Date Range (Jan 2025) returns exactly 3 records');

console.log('\n======================================================');
console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
