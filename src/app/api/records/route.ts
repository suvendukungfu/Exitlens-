import { NextResponse } from 'next/server';
import { DEMO_EXIT_RECORDS } from '@/lib/demo/demoData';

export async function GET() {
  // In production, query database using Drizzle ORM
  // e.g. await db.select().from(exitRecords);
  return NextResponse.json({
    status: 'success',
    count: DEMO_EXIT_RECORDS.length,
    data: DEMO_EXIT_RECORDS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate with Zod and persist to PostgreSQL
    return NextResponse.json({
      status: 'success',
      message: 'Record accepted for ingestion',
      received: body,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to ingest record';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
