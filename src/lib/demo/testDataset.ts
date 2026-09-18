import { ExitRecord, HeadcountConfig } from '../types';
import { calculateTenure } from '../analytics/calculations';

/**
 * ============================================================================
 * FORMAL SYNTHETIC TEST DATASET — STEEL STRIPS WHEELS (EXITLENS VERIFICATION)
 * ============================================================================
 * NOTICE: THIS IS STRICTLY FICTIONAL TEST DATA FOR SYSTEM VERIFICATION.
 * CONTAINS NO REAL EMPLOYEE IDENTIFIERS, NAMES, OR CONFIDENTIAL DETAILS.
 * ALL RECORDS ARE SYNTHETIC GROUND-TRUTH TEST VECTORS.
 * ============================================================================
 */

export const TEST_DATASET_LABEL = 'TEST DATA — SYNTHETIC VERIFICATION SUITE';

export interface GroundTruthExpectedMetrics {
  totalCount: number;
  voluntaryCount: number;
  involuntaryCount: number;
  earlyExitCount: number; // < 1 year
  averageTenureYears: number;
  medianTenureYears: number;
  monthlyCounts: Record<string, number>; // 'YYYY-MM' -> count
  quarterlyCounts: Record<string, number>; // 'YYYY-Q#' -> count
  plantCounts: Record<string, number>;
  departmentCounts: Record<string, number>;
  employmentTypeCounts: Record<string, number>;
  primaryReasonCounts: Record<string, number>;
}

// 12 Handcrafted, Deterministic Synthetic Records covering all required edge cases
export const SYNTHETIC_TEST_RECORDS: ExitRecord[] = [
  // 1. Dappar - Shop Floor - Permanent - Better Compensation - Early Exit (3 months)
  (() => {
    const tenure = calculateTenure('2024-10-01', '2025-01-15', '2024-12-15');
    return {
      id: 'TEST-001',
      employeeId: 'TEST-EMP-101',
      employeeName: 'Fictional Worker Alpha',
      plant: 'Dappar (Punjab)',
      department: 'Production / Shop Floor',
      subDepartment: 'Press & Stamping Line',
      designation: 'Press Operator',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2024-10-01',
      resignationDate: '2024-12-15',
      lastWorkingDate: '2025-01-15',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Better Compensation',
      secondaryReason: 'Higher Fixed CTC',
      detailedReason: 'Offered 25% CTC increment at nearby manufacturing unit.',
      noticePeriod: 30,
      salaryBand: 'Staff / Technician (Grade 2)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Good performance record during tenure.',
      dataEntryDate: '2025-01-15',
      gender: 'Male',
      ageGroup: '25-34',
      grade: 'T-2',
      ...tenure,
    };
  })(),

  // 2. Dappar - Production - Contract - Higher Education - Same Month Joining & Exit (0.8 months)
  (() => {
    const tenure = calculateTenure('2025-01-05', '2025-01-30', '2025-01-20');
    return {
      id: 'TEST-002',
      employeeId: 'TEST-EMP-102',
      employeeName: 'Fictional Worker Beta',
      plant: 'Dappar (Punjab)',
      department: 'Production / Shop Floor',
      subDepartment: 'Rim Line',
      designation: 'Contractual Helper',
      employmentType: 'Contract / Third-Party',
      joiningDate: '2025-01-05',
      resignationDate: '2025-01-20',
      lastWorkingDate: '2025-01-30',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Higher Education',
      secondaryReason: 'Full-Time Degree Program',
      detailedReason: 'Enrolled in polytechnic diploma course.',
      noticePeriod: 10,
      salaryBand: 'Contractual / Casual',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Clean handover to contractor agency.',
      dataEntryDate: '2025-01-30',
      gender: 'Male',
      ageGroup: 'Under 25',
      grade: 'C-1',
      ...tenure,
    };
  })(),

  // 3. Jamshedpur - Quality - Permanent - Career Growth - Exactly 1-Year Tenure (366 days in leap year 2024)
  (() => {
    const tenure = calculateTenure('2024-02-01', '2025-02-01', '2025-01-01');
    return {
      id: 'TEST-003',
      employeeId: 'TEST-EMP-103',
      employeeName: 'Fictional Engineer Gamma',
      plant: 'Jamshedpur (Jharkhand)',
      department: 'Quality Assurance & Metallurgy',
      subDepartment: 'Metallurgical Lab & Testing',
      designation: 'Quality Engineer',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2024-02-01',
      resignationDate: '2025-01-01',
      lastWorkingDate: '2025-02-01',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Career Growth / Promotion',
      secondaryReason: 'Senior Designation Offer',
      detailedReason: 'Moving to auto OEM as Assistant Manager.',
      noticePeriod: 30,
      salaryBand: 'Band A (Executive / Engineer)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Eligible for future rehire.',
      dataEntryDate: '2025-02-01',
      gender: 'Female',
      ageGroup: '25-34',
      grade: 'E-2',
      ...tenure,
    };
  })(),

  // 4. Jamshedpur - Tool Room - Apprentice - Relocation - Missing Last Working Date (Fallback to Resignation Date)
  (() => {
    // Missing LWD -> fallback to resignationDate
    const tenure = calculateTenure('2024-06-01', undefined, '2025-02-15');
    return {
      id: 'TEST-004',
      employeeId: 'TEST-EMP-104',
      employeeName: 'Fictional Trainee Delta',
      plant: 'Jamshedpur (Jharkhand)',
      department: 'Tool Room & Die Maintenance',
      subDepartment: 'Die Maintenance',
      designation: 'Tooling Apprentice',
      employmentType: 'Apprentice / Trainee',
      joiningDate: '2024-06-01',
      resignationDate: '2025-02-15',
      lastWorkingDate: undefined, // Intentional missing optional value
      exitType: 'Voluntary Resignation',
      primaryReason: 'Relocation / Family Reasons',
      secondaryReason: 'Elderly Parent Care',
      detailedReason: 'Relocating to native village.',
      noticePeriod: 15,
      salaryBand: 'Contractual / Casual',
      replacementRequired: 'No',
      exitInterviewCompleted: 'No',
      rehireEligible: 'Yes',
      hrRemarks: 'Apprenticeship completion certificate issued.',
      dataEntryDate: '2025-02-15',
      gender: 'Male',
      ageGroup: 'Under 25',
      grade: 'TR-1',
      ...tenure,
    };
  })(),

  // 5. Jamshedpur - Maintenance - Permanent - Health Issues - Missing Resignation Date (Valid LWD)
  (() => {
    const tenure = calculateTenure('2022-03-01', '2025-02-28', undefined);
    return {
      id: 'TEST-005',
      employeeId: 'TEST-EMP-105',
      employeeName: 'Fictional Tech Epsilon',
      plant: 'Jamshedpur (Jharkhand)',
      department: 'Maintenance & Engineering',
      subDepartment: 'Electrical Maintenance',
      designation: 'Senior Electrician',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2022-03-01',
      resignationDate: undefined, // Missing resignation date
      lastWorkingDate: '2025-02-28',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Personal / Health Issues',
      secondaryReason: 'Medical Condition',
      detailedReason: 'Advised medical rest for lumbar spondylosis.',
      noticePeriod: 30,
      salaryBand: 'Staff / Technician (Grade 1)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Medical claim documentation completed.',
      dataEntryDate: '2025-02-28',
      gender: 'Male',
      ageGroup: '45-54',
      grade: 'T-1',
      ...tenure,
    };
  })(),

  // 6. Chennai - Supply Chain - Permanent - Performance / Involuntary Exit
  (() => {
    const tenure = calculateTenure('2023-09-01', '2025-03-10', '2025-03-10');
    return {
      id: 'TEST-006',
      employeeId: 'TEST-EMP-106',
      employeeName: 'Fictional Staff Zeta',
      plant: 'Chennai (Tamil Nadu)',
      department: 'Supply Chain, Logistics & Stores',
      subDepartment: 'Raw Material Stores',
      designation: 'Stores Officer',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2023-09-01',
      resignationDate: '2025-03-10',
      lastWorkingDate: '2025-03-10',
      exitType: 'Involuntary Termination',
      primaryReason: 'Disciplinary / Policy Violation',
      secondaryReason: 'Gross Negligence in Inventory',
      detailedReason: 'Inventory audit reconciliation discrepancy; contract terminated with severance.',
      noticePeriod: 0,
      salaryBand: 'Band A (Executive / Engineer)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'No',
      rehireEligible: 'No',
      hrRemarks: 'Ineligible for rehire across any SSW facility.',
      dataEntryDate: '2025-03-10',
      gender: 'Male',
      ageGroup: '35-44',
      grade: 'E-1',
      ...tenure,
    };
  })(),

  // 7. Chennai - Production - Contract - End of Contract (Involuntary/Non-voluntary)
  (() => {
    const tenure = calculateTenure('2024-03-15', '2025-03-14', '2025-03-14');
    return {
      id: 'TEST-007',
      employeeId: 'TEST-EMP-107',
      employeeName: 'Fictional Worker Eta',
      plant: 'Chennai (Tamil Nadu)',
      department: 'Production / Shop Floor',
      subDepartment: 'Paint Shop & CED Coating',
      designation: 'Paint Applicator',
      employmentType: 'Contract / Third-Party',
      joiningDate: '2024-03-15',
      resignationDate: '2025-03-14',
      lastWorkingDate: '2025-03-14',
      exitType: 'End of Contract',
      primaryReason: 'Contract Expiration',
      secondaryReason: 'Vendor Project Term Completed',
      detailedReason: 'Fixed 12-month commercial support contract expired.',
      noticePeriod: 0,
      salaryBand: 'Contractual / Casual',
      replacementRequired: 'No',
      exitInterviewCompleted: 'No',
      rehireEligible: 'Yes',
      hrRemarks: 'Contractor agency billing closed.',
      dataEntryDate: '2025-03-14',
      gender: 'Male',
      ageGroup: '25-34',
      grade: 'C-2',
      ...tenure,
    };
  })(),

  // 8. Mehsana - HR & Admin - Permanent - Commute / Transport
  (() => {
    const tenure = calculateTenure('2023-01-15', '2025-03-25', '2025-02-25');
    return {
      id: 'TEST-008',
      employeeId: 'TEST-EMP-108',
      employeeName: 'Fictional Executive Theta',
      plant: 'Mehsana (Gujarat)',
      department: 'Human Resources & Admin',
      subDepartment: 'Talent Acquisition',
      designation: 'HR Officer',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2023-01-15',
      resignationDate: '2025-02-25',
      lastWorkingDate: '2025-03-25',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Commute / Distance / Relocation',
      secondaryReason: 'Excessive Travel Time',
      detailedReason: 'Daily 75km commute from Ahmedabad proved unsustainable.',
      noticePeriod: 30,
      salaryBand: 'Band A (Executive / Engineer)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Good contributor. Recommended for remote/hybrid roles if available.',
      dataEntryDate: '2025-03-25',
      gender: 'Female',
      ageGroup: '25-34',
      grade: 'E-1',
      ...tenure,
    };
  })(),

  // 9. Mehsana - Production - Permanent - Work Stress & Shift Timings
  (() => {
    const tenure = calculateTenure('2024-05-10', '2025-03-28', '2025-03-01');
    return {
      id: 'TEST-009',
      employeeId: 'TEST-EMP-109',
      employeeName: 'Fictional Operator Iota',
      plant: 'Mehsana (Gujarat)',
      department: 'Production / Shop Floor',
      subDepartment: 'Wheel Disc Assembly',
      designation: 'Line Operator',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2024-05-10',
      resignationDate: '2025-03-01',
      lastWorkingDate: '2025-03-28',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Work Stress & Fatigue',
      secondaryReason: 'Night Shift Hardship',
      detailedReason: 'Requested permanent day shift which was unavailable on the production schedule.',
      noticePeriod: 27,
      salaryBand: 'Staff / Technician (Grade 2)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Exit clearance obtained from production supervisor.',
      dataEntryDate: '2025-03-28',
      gender: 'Male',
      ageGroup: '25-34',
      grade: 'T-2',
      ...tenure,
    };
  })(),

  // 10. Saraikela - Production - Permanent - Long-Tenure Superannuation Retirement (25 years)
  (() => {
    const tenure = calculateTenure('2000-01-10', '2025-01-31', '2024-11-01');
    return {
      id: 'TEST-010',
      employeeId: 'TEST-EMP-110',
      employeeName: 'Fictional Veteran Kappa',
      plant: 'Saraikela (Jharkhand)',
      department: 'Production / Shop Floor',
      subDepartment: 'Final Inspection & Dispatch',
      designation: 'Senior Master Welder',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2000-01-10',
      resignationDate: '2024-11-01',
      lastWorkingDate: '2025-01-31',
      exitType: 'Retirement',
      primaryReason: 'Retirement',
      secondaryReason: 'Superannuation at Age 58',
      detailedReason: 'Superannuation after 25 years of distinguished manufacturing service.',
      noticePeriod: 90,
      salaryBand: 'Staff / Technician (Grade 1)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'No',
      hrRemarks: 'Full retirement settlement paid with commendation plaque.',
      dataEntryDate: '2025-01-31',
      gender: 'Male',
      ageGroup: '55+',
      grade: 'T-1',
      ...tenure,
    };
  })(),

  // 11. Saraikela - Finance & Accounts - Permanent - Better Compensation
  (() => {
    const tenure = calculateTenure('2021-07-01', '2025-02-20', '2025-01-15');
    return {
      id: 'TEST-011',
      employeeId: 'TEST-EMP-111',
      employeeName: 'Fictional Officer Lambda',
      plant: 'Saraikela (Jharkhand)',
      department: 'Finance, Accounts & Costing',
      subDepartment: 'Plant Costing & Ledger',
      designation: 'Assistant Manager Costing',
      employmentType: 'Permanent / On-Roll',
      joiningDate: '2021-07-01',
      resignationDate: '2025-01-15',
      lastWorkingDate: '2025-02-20',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Better Compensation',
      secondaryReason: 'Higher CTC and Bonus',
      detailedReason: 'Accepted offer at metallurgical EPC conglomerate.',
      noticePeriod: 35,
      salaryBand: 'Band B (Middle Management)',
      replacementRequired: 'Yes',
      exitInterviewCompleted: 'Yes',
      rehireEligible: 'Yes',
      hrRemarks: 'Formal handover of financial models completed.',
      dataEntryDate: '2025-02-20',
      gender: 'Male',
      ageGroup: '35-44',
      grade: 'M-1',
      ...tenure,
    };
  })(),

  // 12. Dappar - Health, Safety & Environment - Apprentice - Unknown / Undisclosed Reason
  (() => {
    const tenure = calculateTenure('2024-09-01', '2025-03-15', '2025-03-01');
    return {
      id: 'TEST-012',
      employeeId: 'TEST-EMP-112',
      employeeName: 'Fictional Candidate Mu',
      plant: 'Dappar (Punjab)',
      department: 'Health, Safety & Environment (HSE)',
      subDepartment: 'Plant Safety',
      designation: 'Safety Trainee',
      employmentType: 'Apprentice / Trainee',
      joiningDate: '2024-09-01',
      resignationDate: '2025-03-01',
      lastWorkingDate: '2025-03-15',
      exitType: 'Voluntary Resignation',
      primaryReason: 'Unknown / Not Disclosed', // Explicit required edge-case
      secondaryReason: undefined,
      detailedReason: undefined,
      noticePeriod: 14,
      salaryBand: 'Contractual / Casual',
      replacementRequired: 'Pending',
      exitInterviewCompleted: 'No',
      rehireEligible: 'Yes',
      hrRemarks: 'Candidate declined exit interview disclosure.',
      dataEntryDate: '2025-03-15',
      gender: 'Male',
      ageGroup: 'Under 25',
      grade: 'TR-1',
      ...tenure,
    };
  })(),
];

// Synthetic Headcount dataset strictly corresponding to test periods (2025)
export const SYNTHETIC_TEST_HEADCOUNTS: HeadcountConfig[] = [
  { plant: 'Dappar (Punjab)', department: 'All', year: 2025, month: 1, headcount: 1500 },
  { plant: 'Jamshedpur (Jharkhand)', department: 'All', year: 2025, month: 1, headcount: 1800 },
  { plant: 'Chennai (Tamil Nadu)', department: 'All', year: 2025, month: 1, headcount: 1200 },
  { plant: 'Mehsana (Gujarat)', department: 'All', year: 2025, month: 1, headcount: 1000 },
  { plant: 'Saraikela (Jharkhand)', department: 'All', year: 2025, month: 1, headcount: 600 },
];
// Total average company headcount = 1500 + 1800 + 1200 + 1000 + 600 = 6100 employees.

/**
 * EXACT MANUALLY PRE-CALCULATED GROUND TRUTH FOR SYNTHETIC_TEST_RECORDS
 * Total records: 12
 *
 * Exit dates by month:
 * - 2025-01: 3 exits (TEST-001: Jan 15, TEST-002: Jan 30, TEST-010: Jan 31)
 * - 2025-02: 4 exits (TEST-003: Feb 1, TEST-004: Feb 15, TEST-005: Feb 28, TEST-011: Feb 20)
 * - 2025-03: 5 exits (TEST-006: Mar 10, TEST-007: Mar 14, TEST-008: Mar 25, TEST-009: Mar 28, TEST-012: Mar 15)
 *
 * Voluntary vs Involuntary:
 * - Voluntary Resignation: 9 (TEST-001, 002, 003, 004, 005, 008, 009, 011, 012)
 * - Involuntary: 3 (TEST-006: Involuntary Termination, TEST-007: End of Contract, TEST-010: Retirement)
 *
 * Plants:
 * - Dappar (Punjab): 3 (TEST-001, TEST-002, TEST-012)
 * - Jamshedpur (Jharkhand): 3 (TEST-003, TEST-004, TEST-005)
 * - Chennai (Tamil Nadu): 2 (TEST-006, TEST-007)
 * - Mehsana (Gujarat): 2 (TEST-008, TEST-009)
 * - Saraikela (Jharkhand): 2 (TEST-010, TEST-011)
 *
 * Departments:
 * - Production / Shop Floor: 5 (TEST-001, 002, 007, 009, 010)
 * - Quality Assurance & Metallurgy: 1 (TEST-003)
 * - Tool Room & Die Maintenance: 1 (TEST-004)
 * - Maintenance & Engineering: 1 (TEST-005)
 * - Supply Chain, Logistics & Stores: 1 (TEST-006)
 * - Human Resources & Admin: 1 (TEST-008)
 * - Finance, Accounts & Costing: 1 (TEST-011)
 * - Health, Safety & Environment (HSE): 1 (TEST-012)
 *
 * Employment Types:
 * - Permanent / On-Roll: 8
 * - Contract / Third-Party: 2
 * - Apprentice / Trainee: 2
 *
 * Primary Reasons:
 * - Better Compensation: 2 (TEST-001, TEST-011)
 * - Higher Education: 1 (TEST-002)
 * - Career Growth / Promotion: 1 (TEST-003)
 * - Relocation / Family Reasons: 1 (TEST-004)
 * - Personal / Health Issues: 1 (TEST-005)
 * - Disciplinary / Policy Violation: 1 (TEST-006)
 * - Contract Expiration: 1 (TEST-007)
 * - Commute / Distance / Relocation: 1 (TEST-008)
 * - Work Stress & Fatigue: 1 (TEST-009)
 * - Retirement: 1 (TEST-010)
 * - Unknown / Not Disclosed: 1 (TEST-012)
 *
 * Expected Annualized Attrition Rate for 2025:
 * Total Exits: 12
 * Headcount: 6100
 * Attrition Rate = (12 / 6100) * 100 = 0.2%
 *
 * Chennai Filtered Attrition Rate:
 * Chennai Exits: 2
 * Chennai Headcount: 1200
 * Chennai Attrition Rate = (2 / 1200) * 100 = 0.2%
 */
export const GROUND_TRUTH_EXPECTATIONS: GroundTruthExpectedMetrics = {
  totalCount: 12,
  voluntaryCount: 9,
  involuntaryCount: 3,
  earlyExitCount: 6, // tenure < 1 year: TEST-001 (0.3), TEST-002 (0.1), TEST-004 (0.7), TEST-007 (1.0 = 364/365.25), TEST-009 (0.9), TEST-012 (0.5)
  averageTenureYears: 3.5, // approximate, verified in test script
  medianTenureYears: 1.0,
  monthlyCounts: {
    '2025-01': 3,
    '2025-02': 4,
    '2025-03': 5,
  },
  quarterlyCounts: {
    '2025-Q1': 12,
  },
  plantCounts: {
    'Dappar (Punjab)': 3,
    'Jamshedpur (Jharkhand)': 3,
    'Chennai (Tamil Nadu)': 2,
    'Mehsana (Gujarat)': 2,
    'Saraikela (Jharkhand)': 2,
  },
  departmentCounts: {
    'Production / Shop Floor': 5,
    'Quality Assurance & Metallurgy': 1,
    'Tool Room & Die Maintenance': 1,
    'Maintenance & Engineering': 1,
    'Supply Chain, Logistics & Stores': 1,
    'Human Resources & Admin': 1,
    'Finance, Accounts & Costing': 1,
    'Health, Safety & Environment (HSE)': 1,
  },
  employmentTypeCounts: {
    'Permanent / On-Roll': 8,
    'Contract / Third-Party': 2,
    'Apprentice / Trainee': 2,
  },
  primaryReasonCounts: {
    'Better Compensation': 2,
    'Higher Education': 1,
    'Career Growth / Promotion': 1,
    'Relocation / Family Reasons': 1,
    'Personal / Health Issues': 1,
    'Disciplinary / Policy Violation': 1,
    'Contract Expiration': 1,
    'Commute / Distance / Relocation': 1,
    'Work Stress & Fatigue': 1,
    'Retirement': 1,
    'Unknown / Not Disclosed': 1,
  },
};
