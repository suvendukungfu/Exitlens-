# ExitLens — Employee Exit Intelligence

> **Current Status:** Enterprise Foundation & Multi-User Architecture (Milestone 2)  
> **Target Organization:** Steel Strips Wheels Limited (SSWL) — Automotive Wheel Manufacturing Facilities  
> **Production Readiness:** Enterprise Architecture Implemented (Requires corporate IdP SSO binding & AWS RDS/PostgreSQL instance provisioning for live cloud production)

**ExitLens** is an enterprise-grade employee exit analytics, retention intelligence, and workforce diagnostics platform engineered specifically for the multi-facility manufacturing plants of **Steel Strips Wheels Limited (SSWL)**.

It replaces fragmented, inconsistent Excel spreadsheets across plant locations with a secure, standardized data ingestion pipeline, plant-level access isolation, audit logging, and high-fidelity analytics.

---

## 🏛️ Milestone 2 Enterprise Architecture

```
                                  EXITLENS ARCHITECTURE
                                  
   +-----------------------------------------------------------------------------------+
   |                                 PRESENTATION LAYER                                |
   |  Next.js 16 App Router | Tailwind CSS | Recharts | TopHeader Persona Switcher     |
   |                                                                                   |
   |  [Overview]  [Trends]  [Departments]  [Plants]  [Reasons]  [Tenure]  [Records]    |
   |  [Import Pipeline]  [Import History]  [Data Quality]  [Reports & PDF/Excel Export]|
   |  [Master Taxonomies]  [Role Governance & Access]  [PostgreSQL Status & DDL]       |
   +------------------------------------------+----------------------------------------+
                                              |
                                              v
   +-----------------------------------------------------------------------------------+
   |                            DEV AUTH & ROLE CONTEXT                                |
   |  Corporate HR (Org-wide) | Plant HR (Quarantined) | HR Admin | Viewer (Read-only) |
   +------------------------------------------+----------------------------------------+
                                              |
                                              v
   +-----------------------------------------------------------------------------------+
   |                        TYPED SERVICE & REPOSITORY LAYER                           |
   |                                                                                   |
   |   +-----------------------+   +-----------------------+   +--------------------+  |
   |   |   ExitRecordService   |   |  ImportBatchService   |   |    AuditService    |  |
   |   |  (Plant Isolation     |   |  (Deduplication,      |   |  (Privacy-safe,    |  |
   |   |   & Access Filtering) |   |   Lifecycle & Errors) |   |   Remarks Scrubbed)|  |
   |   +-----------------------+   +-----------------------+   +--------------------+  |
   +------------------------------------------+----------------------------------------+
                                              |
                        +---------------------+---------------------+
                        |                                           |
                        v                                           v
   +--------------------------------------+   +----------------------------------------+
   |   POSTGRESQL RELATIONAL ENGINE       |   |   RESILIENT LOCAL / DEMO ENGINE        |
   |   PostgreSQL 14+ Relational DB       |   |   LocalStorage Persistence             |
   |   Schema 0001 (13 Core Tables, UUID) |   |   Zero-Config Browser Demonstration    |
   +--------------------------------------+   +----------------------------------------+
```

---

## 🗄️ Database Architecture & 12 Core Tables

ExitLens features a formal 12-domain relational schema defined in [`src/lib/db/migrations/0001_initial_schema.sql`](file:///Users/suvendusahoo/leavingreason%20/src/lib/db/migrations/0001_initial_schema.sql) and [`src/lib/db/schema.ts`](file:///Users/suvendusahoo/leavingreason%20/src/lib/db/schema.ts).

### Entity-Relationship Structure

| Table Name | Primary Key | Key Constraints & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| **`roles`** | `UUID` (v4) | `code UNIQUE` (`CORP_HR`, `PLANT_HR`, `HR_ADMIN`, `VIEWER`) | Enterprise role definitions. |
| **`plants`** | `UUID` (v4) | `code UNIQUE`, `name UNIQUE` | Master manufacturing units (*Chennai, Dappar, Jamshedpur, Mehsana, Saraikela*). |
| **`users`** | `UUID` (v4) | `email UNIQUE`, `role_id FK`, `plant_id FK NULLABLE` | User identity and plant assignment (NULL = Org-wide). |
| **`departments`** | `UUID` (v4) | `name UNIQUE` | Approved functional departments. |
| **`sub_departments`**| `UUID` (v4) | `department_id FK`, `UNIQUE(department_id, name)` | Work centers and lines. |
| **`employment_types`**| `UUID` (v4)| `code UNIQUE` | Employment contract categories. |
| **`exit_types`** | `UUID` (v4) | `code UNIQUE` | Voluntary and involuntary separation types. |
| **`reason_categories`**| `UUID` (v4)| `category UNIQUE` | 15 standardized exit reason taxonomies. |
| **`headcount_records`**| `UUID` (v4)| `plant_id FK`, `department_id FK`, `UNIQUE(plant_id, dept_id, year, month)` | Monthly headcounts required for true attrition rates. |
| **`import_batches`** | `UUID` (v4) | `uploaded_by_user_id FK`, `status CHECK`, `file_hash INDEX` | Excel batch upload lifecycle tracking. |
| **`import_errors`** | `UUID` (v4) | `batch_id FK ON DELETE CASCADE`, `severity CHECK` | Row-by-row validation error diagnostics. |
| **`exit_records`** | `UUID` (v4) | `batch_id FK`, `employee_id INDEX` (Natural Key, NOT PK), `CHECK(joining_date <= last_working_date)` | Primary employee exit fact register. |
| **`audit_logs`** | `UUID` (v4) | `actor_user_id FK`, `event_type INDEX`, `timestamp INDEX` | Structured security and data mutation audit log. |

### Architectural Review Findings
1. **Identifier Strategy:** Every table utilizes UUID v4 (`uuid_generate_v4()`) as stable technical primary keys. `employee_id` is an indexed natural business identifier, never the database PK, accommodating re-hires and multi-stint employees.
2. **Date Chronology:** Handled through PostgreSQL native `DATE` and `TIMESTAMP WITH TIME ZONE`. Enforced with a SQL table-level constraint: `CHECK (joining_date <= last_working_date)`.
3. **Headcount Uniqueness:** Headcounts enforce a composite unique index on `(plant_id, department_id, year, month)` to prevent duplicate headcounts from distorting attrition percentages.

---

## 🛡️ Authentication Foundation & Role Governance

ExitLens operates in a transparent **Development Authentication Mode** with pre-configured personas to evaluate security boundaries without simulating fake SSO credentials:

### Role Permissions Matrix

| Capability | Corporate HR | Plant HR Officer | HR Administrator | Viewer / Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **Multi-Plant Org-Wide View** | ✅ Yes | ❌ Restricted to Assigned Plant | ✅ Yes | ✅ Yes (Aggregated) |
| **Excel Batch Upload (Append)**| ✅ Yes | ✅ Yes (Assigned Plant Only) | ✅ Yes | ❌ Read-Only |
| **Dataset Replacement (Wipe)**| ✅ Yes | ❌ Denied | ✅ Yes | ❌ Read-Only |
| **Edit Employee Records** | ✅ Yes | ✅ Yes (Assigned Plant Only) | ✅ Yes | ❌ Read-Only |
| **Delete Individual Records** | ✅ Yes | ❌ Denied | ✅ Yes | ❌ Read-Only |
| **Master Taxonomy Governance** | ❌ Read-Only | ❌ Read-Only | ✅ Full Admin | ❌ Read-Only |
| **Security Audit Trail** | ✅ Yes | ❌ Assigned Plant Only | ✅ Yes | ❌ Read-Only |

### Development Personas (Available via TopHeader Switcher)
1. **Aman Sharma** (`aman.sharma@sswlindia.com`) — Corporate HR Lead (Org-wide access across all 5 plants)
2. **Priya Sundaram** (`priya.sundaram@sswlindia.com`) — Plant HR Officer (Restricted strictly to Chennai Facility)
3. **Vikramjit Singh** (`vikramjit.singh@sswlindia.com`) — Plant HR Officer (Restricted strictly to Dappar Facility)
4. **Rajeev Mehta** (`rajeev.mehta@sswlindia.com`) — HR Technology Director (HR Admin, full governance)
5. **S. Krishnan** (`s.krishnan@auditors-ext.com`) — Internal Auditor (Viewer, read-only analytics)

---

## 🔒 Server-Side Plant-Level Data Isolation

Data isolation is not merely a UI filter—it is enforced in [`src/lib/services/exitRecordService.ts`](file:///Users/suvendusahoo/leavingreason%20/src/lib/services/exitRecordService.ts):
* When authenticated as **Plant HR (e.g. Chennai)**:
  * Any request to `ExitRecordService.getExitRecords()` automatically bounds the dataset to `Chennai`.
  * Attempting to fetch an individual employee record from another plant (`ExitRecordService.getExitRecordById`) throws `Access Denied: You are not authorized to view employee records for plant "..."`.
  * Submitting an Excel file containing rows for another plant immediately aborts the transaction with `Security Rejection: Plant HR for Chennai cannot import records for plant "..."`.

---

## 📋 Privacy-Preserving Audit Logging

The [`AuditService`](file:///Users/suvendusahoo/leavingreason%20/src/lib/services/auditService.ts) tracks all critical lifecycle operations:
* `IMPORT_INITIATED`, `IMPORT_COMPLETED`, `IMPORT_FAILED`
* `RECORD_CREATED`, `RECORD_UPDATED`, `RECORD_DELETED`
* `DATASET_REPLACED`
* `EXPORT_GENERATED`
* `CONFIG_CHANGED`

### Privacy Enforcement Rule
Employee exit interviews and resignation remarks frequently contain confidential, sensitive interpersonal remarks. The audit logging engine automatically **scrubs all remark fields** (`hrRemarks`, `detailedReason`, `comments`, `notes`) and logs `[REDACTED_FOR_PRIVACY]` in `summaryMetadata`, logging only operational metrics (row counts, changed field keys, tenure buckets, and timestamps).

---

## 📦 Import Batch Management & History UI

The new **Import History Dashboard** (`/import/history`) provides full traceability:
* **Batch Telemetry:** Batch ID, uploaded file name, timestamp, uploader email, role badge, import mode (Append vs Replace), status (`completed`, `partial`, `failed`).
* **Error Inspection Drawer:** Clicking *Inspect Errors* displays row-by-row diagnostics (Row number, Employee ID, offending field, and validation failure message).
* **Accidental Duplicate Detection:** Identical files (matching file name and row count or hash) trigger an immediate warning in the import wizard, preventing silent duplicates.

---

## 💻 Local Development Setup & Database Seeding

### 1. Prerequisites
* Node.js 18+
* (Optional) Docker or local PostgreSQL 14+

### 2. Quickstart (In-Memory / LocalStorage Mode)
ExitLens operates out of the box with zero external database dependencies:
```bash
git clone <repo-url>
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Local PostgreSQL Setup (Optional)
To connect ExitLens to a local PostgreSQL database:
```bash
# 1. Start a local PostgreSQL 16 container via Docker:
docker run --name exitlens-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=exitlens_dev -p 5432:5432 -d postgres:16-alpine

# 2. Copy environment template:
cp .env.example .env.local

# 3. Apply the initial schema migration:
psql "postgresql://postgres:postgres@localhost:5432/exitlens_dev" -f src/lib/db/migrations/0001_initial_schema.sql

# 4. Seed with fictional SSWL manufacturing data:
npx tsx scripts/seedDatabase.ts --sql | psql "postgresql://postgres:postgres@localhost:5432/exitlens_dev"
```

### 4. Health Check Endpoint
A dedicated system health endpoint is available at `/api/health`, returning database connectivity status, schema version, table counts, uptime, and memory usage.

---

## 🧪 Comprehensive Verification & Test Results

Run all test suites with:
```bash
npm test
```

### Test Results Breakdown:
* **`scripts/verifyAnalytics.ts`**: **41 / 41 PASSED** (Overview metrics, monthly/quarterly aggregations, department/plant cross-matrices, tenure calculation edge cases, leap year rules, attrition rate formulas, filter consistency).
* **`scripts/verifyExcelValidation.ts`**: **17 / 17 PASSED** (Blank row skipping, missing mandatory fields, chronological integrity checks, duplicate Employee ID detection in sheet and system, taxonomy warnings).
* **`scripts/verifyMilestone2.ts`**: **31 / 31 PASSED** (12-table DDL schema constraints, UUID PK validation, role permission checks, server-side plant isolation, batch creation & error logs, duplicate batch detection, append vs replace behavior, privacy-preserving audit scrubbing, empty dataset zero-state stability).
* **Total Automated Tests:** **89 / 89 PASSED (100% Pass Rate)**
* **Linting (`npm run lint`):** **0 errors, 0 warnings**
* **Build (`npm run build`):** **22 / 22 routes compiled successfully with Next.js Turbopack**

---

## ⚠️ Remaining Limitations & Production Roadmap

1. **Enterprise SSO Identity Provider:**  
   The application uses a development multi-persona simulator. Connecting to Steel Strips Wheels' enterprise identity provider (Azure Active Directory / Okta / SAML 2.0) requires configuring client credentials and mapping corporate Active Directory security groups to SSWL plant assignments.
2. **Cloud Database Provisioning:**  
   A production PostgreSQL instance (e.g. AWS RDS PostgreSQL or Supabase) with SSL certificates, connection pooling (`pgbouncer`), and daily automated snapshot backups should be provisioned before deploying to production.
3. **Data Loss Prevention:**  
   Full dataset replacement (`replace` mode) is currently protected by a confirmation dialog and restricted to Corporate HR / HR Admin roles. In production, consider adding a 24-hour snapshot recovery rollback.
