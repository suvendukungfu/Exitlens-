import {
  RawExcelRow,
  ValidationErrorItem,
  ExitRecord,
  ValidationSummary,
} from '../types';
import { calculateTenure } from '../analytics/calculations';
import { INITIAL_MASTER_DATA } from '../constants/masterData';

export const REQUIRED_COLUMNS = [
  'Employee ID',
  'Department',
  'Plant / Location',
  'Joining Date',
  'Last Working Date',
  'Exit Type',
  'Primary Exit Reason',
];

export const ALTERNATIVE_COLUMN_MAP: Record<string, string> = {
  'plant': 'Plant / Location',
  'location': 'Plant / Location',
  'primary reason': 'Primary Exit Reason',
  'reason': 'Primary Exit Reason',
  'detailed reason': 'Detailed Exit Reason',
  'remarks': 'HR Remarks',
  'exit date': 'Last Working Date',
  'lwd': 'Last Working Date',
  'emp id': 'Employee ID',
  'employee name': 'Employee Name',
  'emp name': 'Employee Name',
};

// Date normalization helper (supports ISO, DD/MM/YYYY, MM/DD/YYYY, Excel serials)
export function parseDateCell(val: unknown): string | null {
  if (!val) return null;

  // If already a JS Date
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split('T')[0];
  }

  // If Excel numeric serial date (e.g. 44927)
  if (typeof val === 'number') {
    // Excel base date Dec 30, 1899
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateObj = new Date(utcValue * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return !isNaN(d.getTime()) ? str : null;
  }

  // Check DD-MM-YYYY or DD/MM/YYYY
  const partsDmy = str.split(/[-/]/);
  if (partsDmy.length === 3) {
    if (partsDmy[0].length <= 2 && partsDmy[1].length <= 2 && partsDmy[2].length === 4) {
      const [d, m, y] = partsDmy;
      const formatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const check = new Date(formatted);
      if (!isNaN(check.getTime())) return formatted;
    }
  }

  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString().split('T')[0];
  }

  return null;
}

export function validateUploadedRows(
  rows: RawExcelRow[],
  existingRecords: ExitRecord[] = [],
  masterData = INITIAL_MASTER_DATA
): ValidationSummary {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];
  const parsedRecords: ExitRecord[] = [];
  const skippedRecords: { rowNumber: number; reason: string; raw: Record<string, unknown> }[] = [];

  const seenFileEmpIds = new Set<string>();
  const existingEmpIds = new Set(existingRecords.map((r) => r.employeeId.trim().toUpperCase()));

  const validPlants = new Set(masterData.plants.map((p) => p.toLowerCase()));
  const validDepts = new Set(masterData.departments.map((d) => d.name.toLowerCase()));
  const validReasons = new Set(masterData.primaryReasons.map((r) => r.category.toLowerCase()));
  const validExitTypes = new Set(masterData.exitTypes.map((t) => t.toLowerCase()));

  // Filter completely blank rows upfront
  const nonBlankRows = (rows || []).filter((rawRow) => {
    return Object.values(rawRow).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    );
  });

  // If sheet is completely empty or all rows are blank
  if (nonBlankRows.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      warningRows: 0,
      errorRows: 0,
      isValid: false,
      errors: [
        {
          rowNumber: 1,
          field: 'Workbook',
          message: 'The uploaded file contains no data rows.',
          severity: 'error',
        },
      ],
      warnings: [],
      parsedRecords: [],
      skippedRecords: [],
    };
  }

  nonBlankRows.forEach((rawRow, index) => {
    const rowNum = index + 2; // +2 for 1-based index including header row
    const rowErrors: ValidationErrorItem[] = [];
    const rowWarnings: ValidationErrorItem[] = [];

    // Extract fields with canonical fallback
    const getField = (canonical: string): string => {
      const canonicalKey = canonical.toLowerCase();
      for (const [key, value] of Object.entries(rawRow)) {
        if (key.trim().toLowerCase() === canonicalKey && value !== undefined && value !== null) {
          return String(value).trim();
        }
      }
      for (const [altKey, mapped] of Object.entries(ALTERNATIVE_COLUMN_MAP)) {
        if (mapped === canonical) {
          for (const [key, value] of Object.entries(rawRow)) {
            if (key.trim().toLowerCase() === altKey && value !== undefined && value !== null) {
              return String(value).trim();
            }
          }
        }
      }
      return '';
    };

    const empId = getField('Employee ID');
    const empName = getField('Employee Name');
    const plant = getField('Plant / Location');
    const dept = getField('Department');
    const subDept = getField('Sub-Department');
    const empType = getField('Employment Type') || 'Permanent / On-Roll';
    const designation = getField('Designation') || 'Staff';
    const rawJoinDate = rawRow['Joining Date'] ?? rawRow['joinDate'] ?? rawRow['joining date'];
    const rawResignDate = rawRow['Resignation Date'] ?? rawRow['resignDate'] ?? rawRow['resignation date'];
    const rawLwd = rawRow['Last Working Date'] ?? rawRow['lastWorkingDate'] ?? rawRow['Exit Date'] ?? rawRow['last working date'];
    const exitType = getField('Exit Type');
    const primaryReason = getField('Primary Exit Reason');
    const detailedReason = getField('Detailed Exit Reason') || getField('Detailed Reason');
    const secondaryReason = getField('Secondary Reason');
    const noticePeriodRaw = rawRow['Notice Period'] ?? rawRow['notice period'];
    const salaryBand = getField('Salary Band');
    const replacement = getField('Replacement Required');
    const interviewDone = getField('Exit Interview Completed');
    const rehire = getField('Rehire Eligible');
    const hrRemarks = getField('HR Remarks');
    const dataEntryDateRaw = rawRow['Data Entry Date'];
    const gender = getField('Gender');
    const ageGroup = getField('Age Group');
    const grade = getField('Grade');

    // 1. Mandatory Employee ID
    if (!empId) {
      rowErrors.push({
        rowNumber: rowNum,
        field: 'Employee ID',
        message: 'Employee ID is mandatory and cannot be blank.',
        severity: 'error',
      });
    } else {
      const normalizedId = empId.toUpperCase();
      if (seenFileEmpIds.has(normalizedId)) {
        rowErrors.push({
          rowNumber: rowNum,
          employeeId: empId,
          field: 'Employee ID',
          message: `Duplicate Employee ID "${empId}" detected within the same uploaded file.`,
          severity: 'error',
          value: empId,
        });
      } else {
        seenFileEmpIds.add(normalizedId);
      }

      if (existingEmpIds.has(normalizedId)) {
        rowWarnings.push({
          rowNumber: rowNum,
          employeeId: empId,
          field: 'Employee ID',
          message: `Employee ID "${empId}" already exists in the system. Importing will update this record.`,
          severity: 'warning',
          value: empId,
        });
      }
    }

    // 2. Mandatory Department
    if (!dept) {
      rowErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Department',
        message: 'Department is required.',
        severity: 'error',
      });
    } else if (!validDepts.has(dept.toLowerCase())) {
      rowWarnings.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Department',
        message: `Department "${dept}" does not match standard master list.`,
        severity: 'warning',
        value: dept,
      });
    }

    // 3. Mandatory Plant
    if (!plant) {
      rowErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Plant / Location',
        message: 'Plant / Location is required.',
        severity: 'error',
      });
    } else if (!validPlants.has(plant.toLowerCase())) {
      rowWarnings.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Plant / Location',
        message: `Plant "${plant}" is not in the recognized manufacturing facilities list.`,
        severity: 'warning',
        value: plant,
      });
    }

    // 4. Dates parsing and validation
    const parsedJoinDate = parseDateCell(rawJoinDate);
    const parsedResignDate = parseDateCell(rawResignDate);
    const parsedLwd = parseDateCell(rawLwd);

    if (!parsedJoinDate) {
      rowErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Joining Date',
        message: 'Joining Date is missing or in an unrecognized date format.',
        severity: 'error',
        value: rawJoinDate,
      });
    }

    const effectiveExitDate = parsedLwd || parsedResignDate;
    if (!effectiveExitDate) {
      rowErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Last Working Date',
        message: 'Both Last Working Date and Resignation Date are missing.',
        severity: 'error',
      });
    }

    // Chronology check
    if (parsedJoinDate && effectiveExitDate) {
      if (parsedJoinDate > effectiveExitDate) {
        rowErrors.push({
          rowNumber: rowNum,
          employeeId: empId,
          field: 'Chronology',
          message: `Joining Date (${parsedJoinDate}) cannot be after Exit Date (${effectiveExitDate}).`,
          severity: 'error',
        });
      }
    }

    if (parsedResignDate && parsedLwd && parsedResignDate > parsedLwd) {
      rowWarnings.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Chronology',
        message: `Resignation Date (${parsedResignDate}) is recorded after Last Working Date (${parsedLwd}).`,
        severity: 'warning',
      });
    }

    // 5. Exit Type
    if (!exitType) {
      rowErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Exit Type',
        message: 'Exit Type is mandatory.',
        severity: 'error',
      });
    } else if (!validExitTypes.has(exitType.toLowerCase())) {
      rowWarnings.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Exit Type',
        message: `Exit Type "${exitType}" is non-standard.`,
        severity: 'warning',
        value: exitType,
      });
    }

    // 6. Primary Reason
    if (!primaryReason) {
      rowErrors.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Primary Exit Reason',
        message: 'Primary Exit Reason is mandatory.',
        severity: 'error',
      });
    } else if (!validReasons.has(primaryReason.toLowerCase())) {
      rowWarnings.push({
        rowNumber: rowNum,
        employeeId: empId,
        field: 'Primary Exit Reason',
        message: `Primary reason "${primaryReason}" is not in the 15 standardized categories.`,
        severity: 'warning',
        value: primaryReason,
      });
    }

    // 7. Yes/No Fields
    const validateYesNo = (val: string, fieldName: string) => {
      if (val && !['yes', 'no', 'pending', 'waived', 'conditional'].includes(val.toLowerCase())) {
        rowWarnings.push({
          rowNumber: rowNum,
          employeeId: empId,
          field: fieldName,
          message: `Unexpected value "${val}" for ${fieldName}. Standard values: Yes / No / Pending.`,
          severity: 'warning',
          value: val,
        });
      }
    };
    validateYesNo(replacement, 'Replacement Required');
    validateYesNo(interviewDone, 'Exit Interview Completed');
    validateYesNo(rehire, 'Rehire Eligible');

    // Aggregate row issues
    errors.push(...rowErrors);
    warnings.push(...rowWarnings);

    if (rowErrors.length === 0) {
      const finalJoinDate = parsedJoinDate || '2022-01-01';
      const finalResignDate = parsedResignDate || effectiveExitDate || '2025-01-01';
      const finalLwd = parsedLwd || finalResignDate;

      const { tenureMonths, tenureYears, tenureBucket } = calculateTenure(
        finalJoinDate,
        finalLwd,
        finalResignDate
      );

      const parsedReplacement: 'Yes' | 'No' | 'Pending' =
        replacement === 'Yes' || replacement === 'No' || replacement === 'Pending'
          ? replacement
          : 'Pending';

      const parsedInterview: 'Yes' | 'No' | 'Waived' =
        interviewDone === 'Yes' || interviewDone === 'No' || interviewDone === 'Waived'
          ? interviewDone
          : 'Yes';

      const parsedRehire: 'Yes' | 'No' | 'Conditional' =
        rehire === 'Yes' || rehire === 'No' || rehire === 'Conditional'
          ? rehire
          : 'Yes';

      const parsedGender: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | undefined =
        gender === 'Male' || gender === 'Female' || gender === 'Other' || gender === 'Prefer not to say'
          ? gender
          : undefined;

      const parsedAgeGroup: 'Under 25' | '25-34' | '35-44' | '45-54' | '55+' | undefined =
        ageGroup === 'Under 25' || ageGroup === '25-34' || ageGroup === '35-44' || ageGroup === '45-54' || ageGroup === '55+'
          ? ageGroup
          : undefined;

      parsedRecords.push({
        id: `IMP-${Date.now().toString(36)}-${index}`,
        employeeId: empId,
        employeeName: empName || 'Confidential Employee',
        department: dept,
        subDepartment: subDept || 'General',
        plant: plant,
        employmentType: empType,
        designation: designation,
        joiningDate: finalJoinDate,
        resignationDate: finalResignDate,
        lastWorkingDate: finalLwd,
        exitType: exitType,
        primaryReason: primaryReason,
        detailedReason: detailedReason,
        secondaryReason: secondaryReason,
        noticePeriod: Number(noticePeriodRaw) || 30,
        salaryBand: salaryBand || 'Staff / Technician (Grade 1)',
        replacementRequired: parsedReplacement,
        exitInterviewCompleted: parsedInterview,
        rehireEligible: parsedRehire,
        hrRemarks: hrRemarks,
        dataEntryDate: parseDateCell(dataEntryDateRaw) || new Date().toISOString().split('T')[0],
        gender: parsedGender,
        ageGroup: parsedAgeGroup,
        grade: grade || undefined,
        tenureMonths,
        tenureYears,
        tenureBucket,
      });
    } else {
      skippedRecords.push({
        rowNumber: rowNum,
        reason: rowErrors.map((e) => e.message).join(' | '),
        raw: rawRow,
      });
    }
  });

  const errorRowSet = new Set(errors.map((e) => e.rowNumber));
  const warningRowSet = new Set(warnings.map((w) => w.rowNumber));

  return {
    totalRows: nonBlankRows.length,
    validRows: parsedRecords.length,
    warningRows: warningRowSet.size,
    errorRows: errorRowSet.size,
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedRecords,
    skippedRecords,
  };
}
