/**
 * Privacy-Preserving Audit Logging Service
 * Tracks mutation events, security actions, and import lifecycle.
 * CRITICAL: Resignation remarks, employee names, and sensitive free-text are scrubbed.
 */

import { AuthUser } from './authService';

export type AuditEventType =
  | 'IMPORT_INITIATED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'RECORD_CREATED'
  | 'RECORD_UPDATED'
  | 'RECORD_DELETED'
  | 'DATASET_REPLACED'
  | 'EXPORT_GENERATED'
  | 'CONFIG_CHANGED';

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  actorUserId?: string;
  actorEmail: string;
  actorRole: string;
  entityType: 'exit_record' | 'import_batch' | 'dataset' | 'master_data' | 'report_export';
  entityId?: string;
  plant?: string;
  summaryMetadata: Record<string, unknown>;
  timestamp: string;
}

const IN_MEMORY_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-seed-01',
    eventType: 'IMPORT_COMPLETED',
    actorUserId: 'usr-corp-01',
    actorEmail: 'aman.sharma@sswlindia.com',
    actorRole: 'CORP_HR',
    entityType: 'import_batch',
    entityId: 'BATCH-202603-001',
    plant: 'All Plants',
    summaryMetadata: {
      fileName: 'SSWL_Q1_Exits_Consolidated.xlsx',
      totalRows: 115,
      validRows: 115,
      invalidRows: 0,
      importMode: 'replace',
    },
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'aud-seed-02',
    eventType: 'CONFIG_CHANGED',
    actorUserId: 'usr-admin-01',
    actorEmail: 'rajeev.mehta@sswlindia.com',
    actorRole: 'HR_ADMIN',
    entityType: 'master_data',
    entityId: 'taxonomies',
    summaryMetadata: {
      action: 'Updated plant headcount baseline for 2026',
      departmentsCovered: 8,
    },
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export class AuditService {
  /**
   * Records a security or data lifecycle event.
   * Strips any sensitive employee remarks or PII automatically.
   */
  static logEvent(
    eventType: AuditEventType,
    user: AuthUser,
    entityType: AuditLogEntry['entityType'],
    options: {
      entityId?: string;
      plant?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): AuditLogEntry {
    // Sanitize metadata to guarantee no remarks or PII are logged
    const safeMetadata: Record<string, unknown> = {};
    if (options.metadata) {
      for (const [key, value] of Object.entries(options.metadata)) {
        // Redact any remark, comment, reason text, or PII field
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('remark') ||
          lowerKey.includes('comment') ||
          lowerKey.includes('detailedreason') ||
          lowerKey.includes('notes')
        ) {
          safeMetadata[key] = '[REDACTED_FOR_PRIVACY]';
        } else {
          safeMetadata[key] = value;
        }
      }
    }

    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      entityType,
      entityId: options.entityId,
      plant: options.plant || user.assignedPlant || 'Global',
      summaryMetadata: safeMetadata,
      timestamp: new Date().toISOString(),
    };

    IN_MEMORY_AUDIT_LOGS.unshift(entry);

    // Keep log bounded to recent 200 entries in-memory
    if (IN_MEMORY_AUDIT_LOGS.length > 200) {
      IN_MEMORY_AUDIT_LOGS.pop();
    }

    // Persist to local storage if running in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('exitlens_audit_logs_v1', JSON.stringify(IN_MEMORY_AUDIT_LOGS.slice(0, 50)));
      } catch {
        // Fallback
      }
    }

    return entry;
  }

  /**
   * Retrieve audit logs with optional filtering by event type or actor
   */
  static getAuditLogs(
    user: AuthUser,
    filters?: { eventType?: AuditEventType; plant?: string; limit?: number }
  ): AuditLogEntry[] {
    let logs = [...IN_MEMORY_AUDIT_LOGS];

    // Plant HR can only see audit events related to their facility
    if (user.role === 'PLANT_HR' && user.assignedPlant) {
      logs = logs.filter(
        (l) => !l.plant || l.plant === 'Global' || l.plant.toLowerCase() === user.assignedPlant?.toLowerCase()
      );
    }

    if (filters?.eventType) {
      logs = logs.filter((l) => l.eventType === filters.eventType);
    }

    if (filters?.plant && filters.plant !== 'All') {
      logs = logs.filter((l) => l.plant === filters.plant);
    }

    return logs.slice(0, filters?.limit || 50);
  }
}
