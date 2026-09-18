import { NextResponse } from 'next/server';
import { DB_SCHEMA_METADATA } from '@/lib/db/schema';

export async function GET() {
  const isPostgresConfigured = !!process.env.DATABASE_URL;

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ExitLens HR Intelligence Core',
    version: '2.1.0-m2',
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: 'PostgreSQL',
      connectionStatus: isPostgresConfigured ? 'connected' : 'placeholder_mode (in-memory / local storage)',
      schemaVersion: '0001_initial_schema',
      trackedTablesCount: DB_SCHEMA_METADATA.tables.length,
      tables: DB_SCHEMA_METADATA.tables,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  });
}
