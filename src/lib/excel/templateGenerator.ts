import * as XLSX from 'xlsx';
import { INITIAL_MASTER_DATA } from '../constants/masterData';

export function generateExcelTemplateBlob(): Blob {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Exit_Register
  const registerHeaders = [
    'Record ID',
    'Employee ID',
    'Employee Name',
    'Department',
    'Sub-Department',
    'Plant / Location',
    'Employment Type',
    'Designation',
    'Joining Date',
    'Resignation Date',
    'Last Working Date',
    'Exit Type',
    'Primary Exit Reason',
    'Detailed Exit Reason',
    'Secondary Reason',
    'Notice Period',
    'Salary Band',
    'Replacement Required',
    'Exit Interview Completed',
    'Rehire Eligible',
    'HR Remarks',
    'Data Entry Date',
    'Gender',
    'Age Group',
    'Grade',
  ];

  const sampleRow1 = [
    'REC-001',
    'SSW-10482',
    'Harpreet Singh',
    'Production / Shop Floor',
    'Rim Line 1',
    'Dappar (Punjab)',
    'Permanent / On-Roll',
    'Sr. Machine Operator',
    '2021-04-12',
    '2025-01-10',
    '2025-02-10',
    'Voluntary Resignation',
    'Compensation & Benefits',
    'Offered 32% compensation hike at an auto-ancillary forging plant in Mohali.',
    'Better Salary Elsewhere',
    30,
    'Staff / Technician (Grade 2)',
    'Yes',
    'Yes',
    'Yes',
    'Consistent performer. Handed over tooling logs smoothly.',
    '2025-01-10',
    'Male',
    '25-34',
    'T-2',
  ];

  const sampleRow2 = [
    'REC-002',
    'SSW-20104',
    'Bikash Murmu',
    'Production / Shop Floor',
    'Disc Press Shop',
    'Jamshedpur (Jharkhand)',
    'Permanent / On-Roll',
    'Press Shop Technician',
    '2019-03-11',
    '2025-01-15',
    '2025-02-15',
    'Voluntary Resignation',
    'Better Industry Opportunity',
    'Offered position at Tata Motors Commercial Vehicle Division.',
    'Better Salary Elsewhere',
    30,
    'Staff / Technician (Grade 1)',
    'Yes',
    'Yes',
    'Yes',
    'Strong mechanical expertise on hydraulic press line.',
    '2025-01-15',
    'Male',
    '25-34',
    'T-1',
  ];

  const registerData = [registerHeaders, sampleRow1, sampleRow2];
  const wsRegister = XLSX.utils.aoa_to_sheet(registerData);

  // Set column widths for readability
  wsRegister['!cols'] = [
    { wch: 12 }, // Record ID
    { wch: 14 }, // Employee ID
    { wch: 22 }, // Employee Name
    { wch: 26 }, // Department
    { wch: 24 }, // Sub-Department
    { wch: 24 }, // Plant / Location
    { wch: 22 }, // Employment Type
    { wch: 24 }, // Designation
    { wch: 14 }, // Joining Date
    { wch: 16 }, // Resignation Date
    { wch: 18 }, // Last Working Date
    { wch: 22 }, // Exit Type
    { wch: 26 }, // Primary Exit Reason
    { wch: 45 }, // Detailed Exit Reason
    { wch: 26 }, // Secondary Reason
    { wch: 14 }, // Notice Period
    { wch: 28 }, // Salary Band
    { wch: 20 }, // Replacement Required
    { wch: 22 }, // Exit Interview Completed
    { wch: 16 }, // Rehire Eligible
    { wch: 40 }, // HR Remarks
    { wch: 16 }, // Data Entry Date
    { wch: 10 }, // Gender
    { wch: 12 }, // Age Group
    { wch: 10 }, // Grade
  ];

  XLSX.utils.book_append_sheet(wb, wsRegister, 'Exit_Register');

  // 2. Sheet: Reason_Master
  const reasonHeaders = ['Primary Reason Category', 'Description / Guidance'];
  const reasonRows = INITIAL_MASTER_DATA.primaryReasons.map((r) => [r.category, r.description]);
  const wsReason = XLSX.utils.aoa_to_sheet([reasonHeaders, ...reasonRows]);
  wsReason['!cols'] = [{ wch: 30 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsReason, 'Reason_Master');

  // 3. Sheet: Instructions
  const instructionsData = [
    ['Steel Strips Wheels — ExitLens Standardized Exit Register Template', ''],
    ['Version:', '2.1 (Enterprise Production)'],
    ['Organization:', 'Steel Strips Wheels (All Plants & Units)'],
    ['', ''],
    ['DATA ENTRY RULES & VALIDATION REQUIREMENTS', ''],
    ['1. Mandatory Fields:', 'Employee ID, Plant, Department, Joining Date, Resignation Date, Last Working Date, Exit Type, Primary Exit Reason.'],
    ['2. Date Format:', 'Please enter dates in YYYY-MM-DD format (e.g. 2025-01-15) or standard Excel Date cells.'],
    ['3. Date Chronology:', 'Joining Date must be on or before Resignation Date, and Resignation Date must be on or before Last Working Date.'],
    ['4. Employee ID:', 'Must be unique across the organization. Duplicate IDs in the same sheet will be flagged for review.'],
    ['5. Standard Plants:', INITIAL_MASTER_DATA.plants.join(', ')],
    ['6. Primary Reasons:', 'Must match one of the 15 categories documented in the "Reason_Master" sheet.'],
    ['7. Yes / No Fields:', 'Allowed values for "Replacement Required", "Exit Interview Completed", "Rehire Eligible" are strictly Yes, No, or Pending/Waived/Conditional.'],
    ['8. Confidentiality:', 'Employee Names and detailed comments are protected under company HR privacy guidelines. Analytical dashboards aggregate data anonymously.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 30 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadExcelTemplate(filename = 'employee_exit_register_template.xlsx') {
  const blob = generateExcelTemplateBlob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
