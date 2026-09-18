import * as XLSX from 'xlsx';
import { ExitRecord, ValidationErrorItem } from '../types';

export function exportExitRecordsToExcel(
  records: ExitRecord[],
  filename = `ExitLens_Export_${new Date().toISOString().split('T')[0]}.xlsx`
) {
  const exportData = records.map((r) => ({
    'Record ID': r.id,
    'Employee ID': r.employeeId,
    'Employee Name': r.employeeName,
    'Department': r.department,
    'Sub-Department': r.subDepartment,
    'Plant / Location': r.plant,
    'Employment Type': r.employmentType,
    'Designation': r.designation,
    'Joining Date': r.joiningDate,
    'Resignation Date': r.resignationDate,
    'Last Working Date': r.lastWorkingDate,
    'Tenure (Years)': r.tenureYears,
    'Tenure (Months)': r.tenureMonths,
    'Tenure Bucket': r.tenureBucket,
    'Exit Type': r.exitType,
    'Primary Exit Reason': r.primaryReason,
    'Detailed Exit Reason': r.detailedReason || '',
    'Secondary Reason': r.secondaryReason || '',
    'Notice Period (Days)': r.noticePeriod || 30,
    'Salary Band': r.salaryBand || '',
    'Replacement Required': r.replacementRequired || '',
    'Exit Interview Completed': r.exitInterviewCompleted || '',
    'Rehire Eligible': r.rehireEligible || '',
    'HR Remarks': r.hrRemarks || '',
    'Gender': r.gender || '',
    'Age Group': r.ageGroup || '',
    'Grade': r.grade || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Filtered_Exit_Records');

  XLSX.writeFile(wb, filename);
}

export function exportValidationErrorReport(
  errors: ValidationErrorItem[],
  warnings: ValidationErrorItem[],
  filename = `ExitLens_Import_Issues_${new Date().toISOString().split('T')[0]}.xlsx`
) {
  const wb = XLSX.utils.book_new();

  // Errors sheet
  const errorRows = errors.map((e) => ({
    'Row Number in File': e.rowNumber,
    'Employee ID': e.employeeId || 'N/A',
    'Field Name': e.field,
    'Severity': 'CRITICAL ERROR (Row Skipped)',
    'Issue Description': e.message,
    'Value In Cell': e.value !== undefined ? String(e.value) : '',
  }));

  const wsErrors = XLSX.utils.json_to_sheet(
    errorRows.length > 0 ? errorRows : [{ 'Status': 'No Critical Errors Found' }]
  );
  XLSX.utils.book_append_sheet(wb, wsErrors, 'Critical_Errors');

  // Warnings sheet
  const warningRows = warnings.map((w) => ({
    'Row Number in File': w.rowNumber,
    'Employee ID': w.employeeId || 'N/A',
    'Field Name': w.field,
    'Severity': 'WARNING (Imported with Flag)',
    'Issue Description': w.message,
    'Value In Cell': w.value !== undefined ? String(w.value) : '',
  }));

  const wsWarnings = XLSX.utils.json_to_sheet(
    warningRows.length > 0 ? warningRows : [{ 'Status': 'No Warnings Found' }]
  );
  XLSX.utils.book_append_sheet(wb, wsWarnings, 'Warnings');

  XLSX.writeFile(wb, filename);
}
