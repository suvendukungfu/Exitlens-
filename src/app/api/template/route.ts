import { NextResponse } from 'next/server';
import { generateExcelTemplateBlob } from '@/lib/excel/templateGenerator';

export async function GET() {
  try {
    const blob = generateExcelTemplateBlob();
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="employee_exit_register_template.xlsx"',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
