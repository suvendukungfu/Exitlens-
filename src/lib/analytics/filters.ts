import { ExitRecord, FilterState } from '../types';

export const INITIAL_FILTER_STATE: FilterState = {
  dateRange: {
    start: '',
    end: '',
    preset: 'ALL',
  },
  plant: [],
  department: [],
  subDepartment: [],
  employmentType: [],
  exitType: [],
  primaryReason: [],
  tenureBucket: [],
  searchQuery: '',
};

export function filterRecords(records: ExitRecord[], filters: FilterState): ExitRecord[] {
  return records.filter((rec) => {
    // 1. Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchId = rec.employeeId?.toLowerCase().includes(q);
      const matchName = rec.employeeName?.toLowerCase().includes(q);
      const matchDept = rec.department?.toLowerCase().includes(q);
      const matchPlant = rec.plant?.toLowerCase().includes(q);
      const matchReason = rec.primaryReason?.toLowerCase().includes(q);
      const matchDesignation = rec.designation?.toLowerCase().includes(q);

      if (!matchId && !matchName && !matchDept && !matchPlant && !matchReason && !matchDesignation) {
        return false;
      }
    }

    // 2. Date Range
    const exitDateStr = rec.lastWorkingDate || rec.resignationDate;
    if (filters.dateRange.start && exitDateStr) {
      if (exitDateStr < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end && exitDateStr) {
      if (exitDateStr > filters.dateRange.end) return false;
    }

    // 3. Plant
    if (filters.plant.length > 0) {
      if (!filters.plant.includes(rec.plant)) return false;
    }

    // 4. Department
    if (filters.department.length > 0) {
      if (!filters.department.includes(rec.department)) return false;
    }

    // 5. Sub-Department
    if (filters.subDepartment.length > 0) {
      if (!filters.subDepartment.includes(rec.subDepartment)) return false;
    }

    // 6. Employment Type
    if (filters.employmentType.length > 0) {
      if (!filters.employmentType.includes(rec.employmentType)) return false;
    }

    // 7. Exit Type
    if (filters.exitType.length > 0) {
      if (!filters.exitType.includes(rec.exitType)) return false;
    }

    // 8. Primary Reason
    if (filters.primaryReason.length > 0) {
      if (!filters.primaryReason.includes(rec.primaryReason)) return false;
    }

    // 9. Tenure Bucket
    if (filters.tenureBucket.length > 0) {
      if (!filters.tenureBucket.includes(rec.tenureBucket)) return false;
    }

    return true;
  });
}
