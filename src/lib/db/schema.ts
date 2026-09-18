/**
 * Database Schema Definitions & DDL for ExitLens
 * Production Ready for PostgreSQL Database Connection (AWS RDS, Supabase, Neon, Docker)
 */

export interface SchemaDoc {
  description: string;
  tables: string[];
}

export const DB_SCHEMA_METADATA: SchemaDoc = {
  description: 'Enterprise Employee Exit Intelligence Database Schema for Steel Strips Wheels Limited',
  tables: [
    'roles',
    'plants',
    'users',
    'departments',
    'sub_departments',
    'employment_types',
    'exit_types',
    'reason_categories',
    'headcount_records',
    'import_batches',
    'import_errors',
    'exit_records',
    'audit_logs',
  ],
};

export const POSTGRES_DDL = `
-- ==============================================================================
-- EXITLENS — ENTERPRISE DATABASE MIGRATION 0001
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Plants Table
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_plant ON users(plant_id);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'Operations',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sub-Departments Table
CREATE TABLE IF NOT EXISTS sub_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, name)
);
CREATE INDEX IF NOT EXISTS idx_sub_dept_dept ON sub_departments(department_id);

-- 6. Employment Types Table
CREATE TABLE IF NOT EXISTS employment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- 7. Exit Types Table
CREATE TABLE IF NOT EXISTS exit_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    is_voluntary BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- 8. Reason Categories Table
CREATE TABLE IF NOT EXISTS reason_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_voluntary BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Headcount Records Table
CREATE TABLE IF NOT EXISTS headcount_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    headcount INT NOT NULL CHECK (headcount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plant_id, department_id, year, month)
);
CREATE INDEX IF NOT EXISTS idx_headcount_plant_period ON headcount_records(plant_id, year, month);

-- 10. Import Batches Table
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64),
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_by_email VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    valid_rows INT NOT NULL DEFAULT 0,
    invalid_rows INT NOT NULL DEFAULT 0,
    warning_count INT NOT NULL DEFAULT 0,
    import_mode VARCHAR(20) NOT NULL CHECK (import_mode IN ('append', 'replace')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'partial')),
    error_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_hash ON import_batches(file_hash);

-- 11. Import Errors Table
CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    employee_id VARCHAR(50),
    field_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('error', 'warning')),
    error_message TEXT NOT NULL,
    raw_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_errors_batch ON import_errors(batch_id);

-- 12. Exit Records Table
CREATE TABLE IF NOT EXISTS exit_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150),
    department VARCHAR(100) NOT NULL,
    sub_department VARCHAR(100),
    plant VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    designation VARCHAR(100),
    joining_date DATE NOT NULL,
    resignation_date DATE,
    last_working_date DATE NOT NULL,
    exit_type VARCHAR(50) NOT NULL,
    primary_reason VARCHAR(100) NOT NULL,
    detailed_reason TEXT,
    secondary_reason VARCHAR(100),
    notice_period_days INT DEFAULT 30,
    salary_band VARCHAR(50),
    replacement_required VARCHAR(20) DEFAULT 'Pending',
    exit_interview_completed VARCHAR(20) DEFAULT 'Yes',
    rehire_eligible VARCHAR(20) DEFAULT 'Yes',
    hr_remarks TEXT,
    data_entry_date DATE DEFAULT CURRENT_DATE,
    gender VARCHAR(30),
    age_group VARCHAR(30),
    grade VARCHAR(30),
    tenure_days INT,
    tenure_months NUMERIC(6,1) NOT NULL,
    tenure_years NUMERIC(4,1) NOT NULL,
    tenure_bucket VARCHAR(30) NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_exit_dates CHECK (joining_date <= last_working_date)
);
CREATE INDEX IF NOT EXISTS idx_exit_records_plant ON exit_records(plant);
CREATE INDEX IF NOT EXISTS idx_exit_records_dept ON exit_records(department);
CREATE INDEX IF NOT EXISTS idx_exit_records_lwd ON exit_records(last_working_date);
CREATE INDEX IF NOT EXISTS idx_exit_records_reason ON exit_records(primary_reason);
CREATE INDEX IF NOT EXISTS idx_exit_records_empid ON exit_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_exit_records_batch ON exit_records(batch_id);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    plant VARCHAR(100),
    summary_metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp DESC);
`;
