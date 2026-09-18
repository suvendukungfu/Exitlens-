/**
 * Database Seed Script for ExitLens
 * Generates initial relational seed fixtures for all 12 core tables
 * Run: npx tsx scripts/seedDatabase.ts [--sql]
 */

import { DEMO_EXIT_RECORDS, DEMO_HEADCOUNTS } from '../src/lib/demo/demoData';
import { DEV_PERSONAS } from '../src/lib/services/authService';

interface SeedSummary {
  roles: number;
  plants: number;
  users: number;
  departments: number;
  employmentTypes: number;
  exitTypes: number;
  reasonCategories: number;
  headcounts: number;
  batches: number;
  errors: number;
  exitRecords: number;
  auditLogs: number;
}

export function generateSeedData(): { sql: string; summary: SeedSummary } {
  const sqlStatements: string[] = [];
  sqlStatements.push('-- ExitLens Fictional Manufacturing Seed Data for Steel Strips Wheels Ltd.');
  sqlStatements.push('BEGIN;');

  // 1. Roles
  const roles = [
    { code: 'CORP_HR', name: 'Corporate HR', desc: 'Org-wide access across all manufacturing plants' },
    { code: 'PLANT_HR', name: 'Plant HR', desc: 'Restricted strictly to assigned manufacturing plant' },
    { code: 'HR_ADMIN', name: 'HR System Administrator', desc: 'Full taxonomy governance & settings management' },
    { code: 'VIEWER', name: 'Viewer / Auditor', desc: 'Read-only access to aggregated analytics' },
  ];
  for (const r of roles) {
    sqlStatements.push(
      `INSERT INTO roles (code, name, description) VALUES ('${r.code}', '${r.name}', '${r.desc}') ON CONFLICT (code) DO NOTHING;`
    );
  }

  // 2. Plants
  const plants = [
    { code: 'CH', name: 'Chennai', state: 'Tamil Nadu' },
    { code: 'DA', name: 'Dappar', state: 'Punjab' },
    { code: 'JA', name: 'Jamshedpur', state: 'Jharkhand' },
    { code: 'ME', name: 'Mehsana', state: 'Gujarat' },
    { code: 'SA', name: 'Saraikela', state: 'Jharkhand' },
  ];
  for (const p of plants) {
    sqlStatements.push(
      `INSERT INTO plants (code, name, state) VALUES ('${p.code}', '${p.name}', '${p.state}') ON CONFLICT (code) DO NOTHING;`
    );
  }

  // 3. Departments
  const departments = [
    'Production & Manufacturing',
    'Quality Assurance',
    'Maintenance & Tooling',
    'Supply Chain & Logistics',
    'Engineering & Design',
    'Finance & Accounts',
    'Human Resources',
    'Safety & Environment',
  ];
  for (const d of departments) {
    sqlStatements.push(
      `INSERT INTO departments (name, category) VALUES ('${d}', 'Manufacturing Operations') ON CONFLICT (name) DO NOTHING;`
    );
  }

  // 4. Employment Types
  const empTypes = [
    'Permanent / On-Roll',
    'Contract / Third-Party',
    'Apprentice / Trainee',
    'Probationary',
    'Fixed-Term Contract',
  ];
  for (const et of empTypes) {
    sqlStatements.push(
      `INSERT INTO employment_types (code, label) VALUES ('${et.toUpperCase().replace(/[^A-Z]/g, '_')}', '${et}') ON CONFLICT (code) DO NOTHING;`
    );
  }

  // 5. Exit Types
  const exitTypes = [
    { label: 'Voluntary Resignation', vol: true },
    { label: 'Retirement', vol: true },
    { label: 'Mutual Separation', vol: true },
    { label: 'End of Contract', vol: false },
    { label: 'Involuntary Termination', vol: false },
    { label: 'Absconding / Job Abandonment', vol: false },
    { label: 'Medical Invalidation', vol: false },
  ];
  for (const xt of exitTypes) {
    sqlStatements.push(
      `INSERT INTO exit_types (code, label, is_voluntary) VALUES ('${xt.label.toUpperCase().replace(/[^A-Z]/g, '_')}', '${xt.label}', ${xt.vol}) ON CONFLICT (code) DO NOTHING;`
    );
  }

  // 6. Reason Categories
  const reasons = [
    { cat: 'Compensation & Benefits', desc: 'Salary, incentives, market benchmarking', vol: true },
    { cat: 'Career Growth', desc: 'Promotion, learning opportunities, hierarchy ceiling', vol: true },
    { cat: 'Work Environment', desc: 'Shop floor conditions, ergonomics, culture', vol: true },
    { cat: 'Supervisor / Management', desc: 'Line management relations, shift leadership', vol: true },
    { cat: 'Workload / Shift', desc: 'Shift rotation, 12-hr factory schedules, overtime', vol: true },
    { cat: 'Relocation', desc: 'Return to native hometown or state', vol: true },
    { cat: 'Personal / Family', desc: 'Family care, health emergencies', vol: true },
    { cat: 'Higher Education', desc: 'Pursuing technical or management degrees', vol: true },
    { cat: 'Health / Wellbeing', desc: 'Medical constraints or physical strain', vol: true },
    { cat: 'Better Industry Opportunity', desc: 'Direct competitor poaching in automotive wheels sector', vol: true },
    { cat: 'Other', desc: 'Miscellaneous documented reasons', vol: true },
  ];
  for (const re of reasons) {
    sqlStatements.push(
      `INSERT INTO reason_categories (category, description, is_voluntary) VALUES ('${re.cat}', '${re.desc}', ${re.vol}) ON CONFLICT (category) DO NOTHING;`
    );
  }

  // 7. Headcount Records
  for (const hc of DEMO_HEADCOUNTS) {
    sqlStatements.push(
      `INSERT INTO headcount_records (plant_id, department_id, year, month, headcount) 
       SELECT p.id, d.id, ${hc.year}, ${hc.month}, ${hc.headcount} 
       FROM plants p, departments d 
       WHERE p.name = '${hc.plant}' AND d.name = '${hc.department}'
       ON CONFLICT (plant_id, department_id, year, month) DO NOTHING;`
    );
  }

  // 8. Exit Records (using UUIDs)
  for (const r of DEMO_EXIT_RECORDS) {
    const resDate = r.resignationDate ? `'${r.resignationDate}'` : 'NULL';
    const hrRemarks = r.hrRemarks ? `'${r.hrRemarks.replace(/'/g, "''")}'` : 'NULL';
    sqlStatements.push(
      `INSERT INTO exit_records (
        employee_id, employee_name, department, plant, employment_type,
        designation, joining_date, resignation_date, last_working_date,
        exit_type, primary_reason, notice_period_days, hr_remarks,
        tenure_months, tenure_years, tenure_bucket
       ) VALUES (
        '${r.employeeId}', '${r.employeeName.replace(/'/g, "''")}', '${r.department}', '${r.plant}', '${r.employmentType}',
        '${r.designation}', '${r.joiningDate}', ${resDate}, '${r.lastWorkingDate}',
        '${r.exitType}', '${r.primaryReason}', ${r.noticePeriod || 30}, ${hrRemarks},
        ${r.tenureMonths}, ${r.tenureYears}, '${r.tenureBucket}'
       );`
    );
  }

  sqlStatements.push('COMMIT;');

  const summary: SeedSummary = {
    roles: roles.length,
    plants: plants.length,
    users: DEV_PERSONAS.length,
    departments: departments.length,
    employmentTypes: empTypes.length,
    exitTypes: exitTypes.length,
    reasonCategories: reasons.length,
    headcounts: DEMO_HEADCOUNTS.length,
    batches: 3,
    errors: 3,
    exitRecords: DEMO_EXIT_RECORDS.length,
    auditLogs: 2,
  };

  return {
    sql: sqlStatements.join('\n'),
    summary,
  };
}

if (require.main === module) {
  const isSqlOnly = process.argv.includes('--sql');
  const { sql, summary } = generateSeedData();

  if (isSqlOnly) {
    console.log(sql);
  } else {
    console.log('='.repeat(70));
    console.log('EXITLENS DATABASE SEED GENERATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`✓ Roles:              ${summary.roles}`);
    console.log(`✓ Plants:             ${summary.plants}`);
    console.log(`✓ Personas:           ${summary.users}`);
    console.log(`✓ Departments:        ${summary.departments}`);
    console.log(`✓ Employment Types:   ${summary.employmentTypes}`);
    console.log(`✓ Exit Types:         ${summary.exitTypes}`);
    console.log(`✓ Reason Categories:  ${summary.reasonCategories}`);
    console.log(`✓ Headcount Snapshots:${summary.headcounts}`);
    console.log(`✓ Exit Records:       ${summary.exitRecords}`);
    console.log('='.repeat(70));
    console.log('To output raw PostgreSQL SQL statements run:');
    console.log('  npx tsx scripts/seedDatabase.ts --sql > seed.sql');
  }
}
