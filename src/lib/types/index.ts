export type EmploymentType =
  | 'Permanent / On-Roll'
  | 'Contract / Third-Party'
  | 'Apprentice / Trainee'
  | 'Probationary'
  | 'Fixed-Term Contract'
  | string;

export type ExitType =
  | 'Voluntary Resignation'
  | 'Retirement'
  | 'Mutual Separation'
  | 'End of Contract'
  | 'Involuntary Termination'
  | 'Absconding / Job Abandonment'
  | 'Medical Invalidation'
  | string;

export type PrimaryReasonCategory =
  | 'Compensation & Benefits'
  | 'Career Growth'
  | 'Work Environment'
  | 'Supervisor / Management'
  | 'Workload / Shift'
  | 'Relocation'
  | 'Personal / Family'
  | 'Higher Education'
  | 'Health / Wellbeing'
  | 'Retirement'
  | 'Contract / Temporary End'
  | 'Attendance / Conduct'
  | 'Better Industry Opportunity'
  | 'Other'
  | 'Unknown / Not Disclosed'
  | string;

export interface ExitRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  subDepartment: string;
  plant: string;
  employmentType: EmploymentType;
  designation: string;
  joiningDate: string; // YYYY-MM-DD
  resignationDate?: string; // YYYY-MM-DD
  lastWorkingDate?: string; // YYYY-MM-DD
  exitType: ExitType;
  primaryReason: PrimaryReasonCategory;
  detailedReason?: string;
  secondaryReason?: string;
  noticePeriod?: number; // in days
  salaryBand?: string;
  replacementRequired?: 'Yes' | 'No' | 'Pending';
  exitInterviewCompleted?: 'Yes' | 'No' | 'Waived';
  rehireEligible?: 'Yes' | 'No' | 'Conditional';
  hrRemarks?: string;
  dataEntryDate?: string;
  // Optional demographics
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  ageGroup?: 'Under 25' | '25-34' | '35-44' | '45-54' | '55+';
  grade?: string;
  // Calculated properties
  tenureMonths: number;
  tenureYears: number;
  tenureBucket: TenureBucket;
}

export type TenureBucket =
  | '0–3 months'
  | '3–6 months'
  | '6–12 months'
  | '1–2 years'
  | '2–5 years'
  | '5+ years';

export interface RawExcelRow {
  'Record ID'?: string | number;
  'Employee ID'?: string | number;
  'Employee Name'?: string;
  'Department'?: string;
  'Sub-Department'?: string;
  'Plant / Location'?: string;
  'Plant'?: string;
  'Employment Type'?: string;
  'Designation'?: string;
  'Joining Date'?: string | number | Date;
  'Resignation Date'?: string | number | Date;
  'Last Working Date'?: string | number | Date;
  'Exit Type'?: string;
  'Primary Exit Reason'?: string;
  'Primary Reason'?: string;
  'Detailed Exit Reason'?: string;
  'Detailed Reason'?: string;
  'Secondary Reason'?: string;
  'Notice Period'?: string | number;
  'Salary Band'?: string;
  'Replacement Required'?: string;
  'Exit Interview Completed'?: string;
  'Rehire Eligible'?: string;
  'HR Remarks'?: string;
  'Data Entry Date'?: string | number | Date;
  'Gender'?: string;
  'Age Group'?: string;
  'Grade'?: string;
  [key: string]: unknown;
}

export type ValidationErrorSeverity = 'error' | 'warning';

export interface ValidationErrorItem {
  rowNumber: number;
  employeeId?: string;
  field: string;
  message: string;
  severity: ValidationErrorSeverity;
  value?: unknown;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  isValid: boolean;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  parsedRecords: ExitRecord[];
  skippedRecords: { rowNumber: number; reason: string; raw: Record<string, unknown> }[];
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
    preset: 'ALL' | 'THIS_YEAR' | 'LAST_12_MONTHS' | 'LAST_YEAR' | 'CUSTOM';
  };
  plant: string[];
  department: string[];
  subDepartment: string[];
  employmentType: string[];
  exitType: string[];
  primaryReason: string[];
  tenureBucket: string[];
  searchQuery: string;
}

export interface MasterDataConfig {
  plants: string[];
  departments: { name: string; subDepartments: string[] }[];
  employmentTypes: string[];
  exitTypes: string[];
  primaryReasons: { category: string; description: string }[];
  secondaryReasons: string[];
  salaryBands: string[];
}

export interface HeadcountConfig {
  plant: string;
  department: string;
  year: number;
  month: number; // 1-12
  headcount: number;
}
