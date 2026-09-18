import { ExitRecord, TenureBucket, HeadcountConfig } from '../types';

/**
 * Calculates tenure in months, years, and assigned tenure bucket
 * Rule: Joining Date to Last Working Date (or Resignation Date if LWD is absent)
 */
export function calculateTenure(
  joiningDateStr: string,
  lastWorkingDateStr?: string,
  resignationDateStr?: string
): { tenureMonths: number; tenureYears: number; tenureBucket: TenureBucket } {
  try {
    const start = new Date(joiningDateStr);
    const endStr = lastWorkingDateStr || resignationDateStr;
    if (!endStr) {
      return { tenureMonths: 0, tenureYears: 0, tenureBucket: '0–3 months' };
    }
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { tenureMonths: 0, tenureYears: 0, tenureBucket: '0–3 months' };
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const tenureYears = Number((diffDays / 365.25).toFixed(1));
    const tenureMonths = Number((diffDays / 30.4375).toFixed(1));

    let tenureBucket: TenureBucket = '0–3 months';
    if (diffDays <= 90) {
      tenureBucket = '0–3 months';
    } else if (diffDays <= 182) {
      tenureBucket = '3–6 months';
    } else if (diffDays <= 365) {
      tenureBucket = '6–12 months';
    } else if (diffDays <= 730) {
      tenureBucket = '1–2 years';
    } else if (diffDays <= 1825) {
      tenureBucket = '2–5 years';
    } else {
      tenureBucket = '5+ years';
    }

    return { tenureMonths, tenureYears, tenureBucket };
  } catch {
    return { tenureMonths: 0, tenureYears: 0, tenureBucket: '0–3 months' };
  }
}

/**
 * Accurately determines if an exit is voluntary (Resignation) vs involuntary/contractual/retirement
 * Guarantees that "Involuntary Termination" is never falsely classified as voluntary.
 */
export function isVoluntaryExit(exitType?: string): boolean {
  if (!exitType) return false;
  const t = exitType.toLowerCase();
  return (t.includes('resignation') || t.includes('voluntary')) && !t.includes('involuntary');
}

export interface OverviewMetrics {
  totalExits: number;
  voluntaryExits: number;
  voluntaryPercentage: number;
  involuntaryExits: number;
  averageTenureYears: number;
  medianTenureYears: number;
  mostCommonReason: { reason: string; count: number; percentage: number };
  attritionRate: number | null; // null if no headcount
  headcountAvailable: boolean;
  earlyExitCount: number; // < 1 year
  earlyExitPercentage: number;
}

export function calculateOverviewMetrics(
  records: ExitRecord[],
  headcounts?: HeadcountConfig[]
): OverviewMetrics {
  const total = records.length;
  if (total === 0) {
    return {
      totalExits: 0,
      voluntaryExits: 0,
      voluntaryPercentage: 0,
      involuntaryExits: 0,
      averageTenureYears: 0,
      medianTenureYears: 0,
      mostCommonReason: { reason: 'N/A', count: 0, percentage: 0 },
      attritionRate: null,
      headcountAvailable: false,
      earlyExitCount: 0,
      earlyExitPercentage: 0,
    };
  }

  const voluntary = records.filter((r) => isVoluntaryExit(r.exitType)).length;

  const involuntary = total - voluntary;
  const voluntaryPercentage = Number(((voluntary / total) * 100).toFixed(1));

  // Tenure calculations
  const sortedTenures = records
    .map((r) => r.tenureYears)
    .filter((t) => typeof t === 'number' && !isNaN(t))
    .sort((a, b) => a - b);

  const sumTenure = sortedTenures.reduce((acc, val) => acc + val, 0);
  const averageTenureYears = sortedTenures.length > 0 ? Number((sumTenure / sortedTenures.length).toFixed(1)) : 0;

  let medianTenureYears = 0;
  if (sortedTenures.length > 0) {
    const mid = Math.floor(sortedTenures.length / 2);
    medianTenureYears =
      sortedTenures.length % 2 !== 0
        ? sortedTenures[mid]
        : Number(((sortedTenures[mid - 1] + sortedTenures[mid]) / 2).toFixed(1));
  }

  // Early exits (< 1 year)
  const earlyExits = records.filter(
    (r) => r.tenureBucket === '0–3 months' || r.tenureBucket === '3–6 months' || r.tenureBucket === '6–12 months'
  ).length;
  const earlyExitPercentage = Number(((earlyExits / total) * 100).toFixed(1));

  // Most common reason
  const reasonCounts: Record<string, number> = {};
  records.forEach((r) => {
    const cat = r.primaryReason || 'Unknown / Not Disclosed';
    reasonCounts[cat] = (reasonCounts[cat] || 0) + 1;
  });

  let maxReason = 'N/A';
  let maxCount = 0;
  Object.entries(reasonCounts).forEach(([r, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxReason = r;
    }
  });

  const reasonPercentage = total > 0 ? Number(((maxCount / total) * 100).toFixed(1)) : 0;

  // Attrition Rate calculation (only if headcounts available)
  let attritionRate: number | null = null;
  let headcountAvailable = false;

  if (headcounts && headcounts.length > 0) {
    // Determine unique plants represented in current record scope
    const recordPlants = new Set(records.map((r) => r.plant));
    const relevantHeadcounts =
      recordPlants.size > 0 && recordPlants.size < 5
        ? headcounts.filter((h) => recordPlants.has(h.plant))
        : headcounts;

    // Calculate average headcount per relevant plant across period
    const plantHeadcountSums: Record<string, { total: number; count: number }> = {};
    relevantHeadcounts.forEach((h) => {
      if (!plantHeadcountSums[h.plant]) {
        plantHeadcountSums[h.plant] = { total: 0, count: 0 };
      }
      plantHeadcountSums[h.plant].total += h.headcount;
      plantHeadcountSums[h.plant].count += 1;
    });

    let aggregateAvgHeadcount = 0;
    Object.values(plantHeadcountSums).forEach(({ total: sum, count }) => {
      if (count > 0) {
        aggregateAvgHeadcount += sum / count;
      }
    });

    if (aggregateAvgHeadcount > 0) {
      attritionRate = Number(((total / aggregateAvgHeadcount) * 100).toFixed(1));
      headcountAvailable = true;
    }
  }

  return {
    totalExits: total,
    voluntaryExits: voluntary,
    voluntaryPercentage,
    involuntaryExits: involuntary,
    averageTenureYears,
    medianTenureYears,
    mostCommonReason: { reason: maxReason, count: maxCount, percentage: reasonPercentage },
    attritionRate,
    headcountAvailable,
    earlyExitCount: earlyExits,
    earlyExitPercentage,
  };
}

export interface MonthlyTrendItem {
  month: string; // "2025-01"
  label: string; // "Jan 2025"
  count: number;
  voluntary: number;
  involuntary: number;
  rollingAvg?: number;
}

export function calculateMonthlyTrend(records: ExitRecord[]): MonthlyTrendItem[] {
  const map: Record<string, { count: number; voluntary: number; involuntary: number; date: Date }> = {};

  records.forEach((r) => {
    const exitDateStr = r.lastWorkingDate || r.resignationDate;
    if (!exitDateStr) return;
    const d = new Date(exitDateStr);
    if (isNaN(d.getTime())) return;

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) {
      map[key] = { count: 0, voluntary: 0, involuntary: 0, date: d };
    }
    map[key].count++;
    const isVol = isVoluntaryExit(r.exitType);
    if (isVol) {
      map[key].voluntary++;
    } else {
      map[key].involuntary++;
    }
  });

  const sortedKeys = Object.keys(map).sort();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const items: MonthlyTrendItem[] = sortedKeys.map((key) => {
    const [year, mStr] = key.split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    return {
      month: key,
      label: `${monthNames[mIdx]} ${year}`,
      count: map[key].count,
      voluntary: map[key].voluntary,
      involuntary: map[key].involuntary,
    };
  });

  // Calculate 3-month rolling average
  for (let i = 0; i < items.length; i++) {
    const windowStart = Math.max(0, i - 2);
    const slice = items.slice(windowStart, i + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.count, 0);
    items[i].rollingAvg = Number((sum / slice.length).toFixed(1));
  }

  return items;
}

export interface QuarterlyTrendItem {
  quarter: string; // "2025-Q1"
  label: string; // "Q1 2025"
  count: number;
  voluntary: number;
  involuntary: number;
}

export function calculateQuarterlyTrend(records: ExitRecord[]): QuarterlyTrendItem[] {
  const map: Record<string, { count: number; voluntary: number; involuntary: number }> = {};

  records.forEach((r) => {
    const exitDateStr = r.lastWorkingDate || r.resignationDate;
    if (!exitDateStr) return;
    const d = new Date(exitDateStr);
    if (isNaN(d.getTime())) return;

    const q = Math.floor(d.getMonth() / 3) + 1;
    const key = `${d.getFullYear()}-Q${q}`;
    if (!map[key]) {
      map[key] = { count: 0, voluntary: 0, involuntary: 0 };
    }
    map[key].count++;
    const isVol = isVoluntaryExit(r.exitType);
    if (isVol) map[key].voluntary++;
    else map[key].involuntary++;
  });

  const sortedKeys = Object.keys(map).sort();
  return sortedKeys.map((key) => {
    const [year, q] = key.split('-');
    return {
      quarter: key,
      label: `${q} ${year}`,
      count: map[key].count,
      voluntary: map[key].voluntary,
      involuntary: map[key].involuntary,
    };
  });
}

export interface CategoryCount {
  name: string;
  count: number;
  percentage: number;
  voluntaryCount?: number;
  averageTenureYears?: number;
}

export function calculateReasonDistribution(records: ExitRecord[]): CategoryCount[] {
  const total = records.length;
  if (total === 0) return [];

  const counts: Record<string, { count: number; tenures: number[] }> = {};
  records.forEach((r) => {
    const reason = r.primaryReason || 'Unknown / Not Disclosed';
    if (!counts[reason]) {
      counts[reason] = { count: 0, tenures: [] };
    }
    counts[reason].count++;
    if (typeof r.tenureYears === 'number') {
      counts[reason].tenures.push(r.tenureYears);
    }
  });

  return Object.entries(counts)
    .map(([name, data]) => {
      const avgTenure =
        data.tenures.length > 0
          ? Number((data.tenures.reduce((a, b) => a + b, 0) / data.tenures.length).toFixed(1))
          : 0;
      return {
        name,
        count: data.count,
        percentage: Number(((data.count / total) * 100).toFixed(1)),
        averageTenureYears: avgTenure,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function calculateDepartmentExits(records: ExitRecord[]): CategoryCount[] {
  const total = records.length;
  if (total === 0) return [];

  const counts: Record<string, { count: number; voluntary: number; tenures: number[] }> = {};
  records.forEach((r) => {
    const dept = r.department || 'Unassigned';
    if (!counts[dept]) {
      counts[dept] = { count: 0, voluntary: 0, tenures: [] };
    }
    counts[dept].count++;
    const isVol = isVoluntaryExit(r.exitType);
    if (isVol) counts[dept].voluntary++;
    if (typeof r.tenureYears === 'number') {
      counts[dept].tenures.push(r.tenureYears);
    }
  });

  return Object.entries(counts)
    .map(([name, data]) => {
      const avgTenure =
        data.tenures.length > 0
          ? Number((data.tenures.reduce((a, b) => a + b, 0) / data.tenures.length).toFixed(1))
          : 0;
      return {
        name,
        count: data.count,
        percentage: Number(((data.count / total) * 100).toFixed(1)),
        voluntaryCount: data.voluntary,
        averageTenureYears: avgTenure,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function calculatePlantExits(records: ExitRecord[]): CategoryCount[] {
  const total = records.length;
  if (total === 0) return [];

  const counts: Record<string, { count: number; voluntary: number; tenures: number[] }> = {};
  records.forEach((r) => {
    const plant = r.plant || 'Unknown Plant';
    if (!counts[plant]) {
      counts[plant] = { count: 0, voluntary: 0, tenures: [] };
    }
    counts[plant].count++;
    const isVol = isVoluntaryExit(r.exitType);
    if (isVol) counts[plant].voluntary++;
    if (typeof r.tenureYears === 'number') {
      counts[plant].tenures.push(r.tenureYears);
    }
  });

  return Object.entries(counts)
    .map(([name, data]) => {
      const avgTenure =
        data.tenures.length > 0
          ? Number((data.tenures.reduce((a, b) => a + b, 0) / data.tenures.length).toFixed(1))
          : 0;
      return {
        name,
        count: data.count,
        percentage: Number(((data.count / total) * 100).toFixed(1)),
        voluntaryCount: data.voluntary,
        averageTenureYears: avgTenure,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function calculateTenureBuckets(records: ExitRecord[]): { bucket: TenureBucket; count: number; percentage: number }[] {
  const buckets: TenureBucket[] = [
    '0–3 months',
    '3–6 months',
    '6–12 months',
    '1–2 years',
    '2–5 years',
    '5+ years',
  ];

  const total = records.length;
  const counts: Record<TenureBucket, number> = {
    '0–3 months': 0,
    '3–6 months': 0,
    '6–12 months': 0,
    '1–2 years': 0,
    '2–5 years': 0,
    '5+ years': 0,
  };

  records.forEach((r) => {
    if (r.tenureBucket && counts[r.tenureBucket] !== undefined) {
      counts[r.tenureBucket]++;
    }
  });

  return buckets.map((bucket) => ({
    bucket,
    count: counts[bucket],
    percentage: total > 0 ? Number(((counts[bucket] / total) * 100).toFixed(1)) : 0,
  }));
}

export function calculateExitTypes(records: ExitRecord[]): CategoryCount[] {
  const total = records.length;
  if (total === 0) return [];

  const counts: Record<string, number> = {};
  records.forEach((r) => {
    const type = r.exitType || 'Unspecified';
    counts[type] = (counts[type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Number(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}

export interface MatrixData {
  rows: string[];
  columns: string[];
  values: Record<string, Record<string, number>>;
  maxVal: number;
}

export function calculateReasonByDepartmentMatrix(records: ExitRecord[]): MatrixData {
  const deptCounts = calculateDepartmentExits(records).slice(0, 7);
  const reasonCounts = calculateReasonDistribution(records).slice(0, 8);

  const rows = reasonCounts.map((r) => r.name);
  const columns = deptCounts.map((d) => d.name);

  const values: Record<string, Record<string, number>> = {};
  rows.forEach((r) => {
    values[r] = {};
    columns.forEach((c) => {
      values[r][c] = 0;
    });
  });

  let maxVal = 0;
  records.forEach((rec) => {
    const r = rec.primaryReason;
    const d = rec.department;
    if (values[r] && values[r][d] !== undefined) {
      values[r][d]++;
      if (values[r][d] > maxVal) {
        maxVal = values[r][d];
      }
    }
  });

  return { rows, columns, values, maxVal };
}

export function calculateReasonByPlantMatrix(records: ExitRecord[]): MatrixData {
  const plantCounts = calculatePlantExits(records);
  const reasonCounts = calculateReasonDistribution(records).slice(0, 8);

  const rows = reasonCounts.map((r) => r.name);
  const columns = plantCounts.map((p) => p.name);

  const values: Record<string, Record<string, number>> = {};
  rows.forEach((r) => {
    values[r] = {};
    columns.forEach((c) => {
      values[r][c] = 0;
    });
  });

  let maxVal = 0;
  records.forEach((rec) => {
    const r = rec.primaryReason;
    const p = rec.plant;
    if (values[r] && values[r][p] !== undefined) {
      values[r][p]++;
      if (values[r][p] > maxVal) {
        maxVal = values[r][p];
      }
    }
  });

  return { rows, columns, values, maxVal };
}

export interface MonthlyReasonCompositionItem {
  month: string;
  label: string;
  total: number;
  [key: string]: string | number;
}

export function calculateMonthlyReasonComposition(
  records: ExitRecord[],
  topN = 5
): MonthlyReasonCompositionItem[] {
  const topReasons = calculateReasonDistribution(records).slice(0, topN).map((r) => r.name);
  const monthMap: Record<string, Record<string, number>> = {};

  records.forEach((r) => {
    const dStr = r.lastWorkingDate || r.resignationDate;
    if (!dStr) return;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { total: 0 };
      topReasons.forEach((reason) => {
        monthMap[monthKey][reason] = 0;
      });
      monthMap[monthKey]['Other Reasons'] = 0;
    }

    monthMap[monthKey].total++;
    const reason = r.primaryReason || 'Other';
    if (topReasons.includes(reason)) {
      monthMap[monthKey][reason] = (monthMap[monthKey][reason] || 0) + 1;
    } else {
      monthMap[monthKey]['Other Reasons'] = (monthMap[monthKey]['Other Reasons'] || 0) + 1;
    }
  });

  const sortedMonths = Object.keys(monthMap).sort();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return sortedMonths.map((mKey) => {
    const [year, mStr] = mKey.split('-');
    const mIdx = parseInt(mStr, 10) - 1;
    return {
      month: mKey,
      label: `${monthNames[mIdx]} ${year}`,
      total: monthMap[mKey].total || 0,
      ...monthMap[mKey],
    };
  });
}

/**
 * Derives strictly calculated observations from active records
 * No hallucinations, no generic placeholders.
 */
export function generateCalculatedObservations(records: ExitRecord[]): string[] {
  if (records.length === 0) {
    return ['No exit records available for the current filter criteria.'];
  }

  const observations: string[] = [];
  const metrics = calculateOverviewMetrics(records);
  const depts = calculateDepartmentExits(records);
  const plants = calculatePlantExits(records);
  const reasons = calculateReasonDistribution(records);
  const tenureBuckets = calculateTenureBuckets(records);

  // 1. Department volume observation (Neutral wording)
  if (depts.length > 0) {
    const topDept = depts[0];
    observations.push(
      `${topDept.name} recorded the highest exit count (${topDept.count} records, representing ${topDept.percentage}% of total exits).`
    );
  }

  // 2. Primary Reason observation
  if (reasons.length > 0) {
    const topReason = reasons[0];
    observations.push(
      `"${topReason.name}" is the most frequently recorded primary exit reason (${topReason.count} exits, ${topReason.percentage}% of total).`
    );
  }

  // 3. Early career / tenure risk observation
  const underOneYearCount = tenureBuckets
    .filter((b) => b.bucket === '0–3 months' || b.bucket === '3–6 months' || b.bucket === '6–12 months')
    .reduce((acc, b) => acc + b.count, 0);
  const underOneYearPct = Number(((underOneYearCount / records.length) * 100).toFixed(1));

  if (underOneYearPct > 0) {
    observations.push(
      `${underOneYearPct}% of departed employees (${underOneYearCount} of ${records.length}) exited within their first 12 months of service.`
    );
  }

  // 4. Plant volume observation
  if (plants.length > 1) {
    const topPlant = plants[0];
    observations.push(
      `${topPlant.name} accounts for the largest share of facility exits (${topPlant.count} records, ${topPlant.percentage}%).`
    );
  }

  // 5. Voluntary separation ratio
  observations.push(
    `Voluntary resignations represent ${metrics.voluntaryPercentage}% of all recorded separations, with a median employee tenure of ${metrics.medianTenureYears} years.`
  );

  return observations;
}
