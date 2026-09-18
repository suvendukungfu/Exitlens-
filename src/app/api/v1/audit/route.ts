import { NextResponse } from 'next/server';
import { AuditService } from '@/lib/services/auditService';
import { DEV_PERSONAS, UserRole } from '@/lib/services/authService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userRole = (searchParams.get('role') as UserRole) || 'CORP_HR';
  const plant = searchParams.get('plant') || undefined;

  const mockUser = DEV_PERSONAS.find((p) => p.role === userRole) || {
    id: 'api-caller',
    name: 'API User',
    email: 'api@sswlindia.com',
    role: userRole,
    roleTitle: userRole,
    assignedPlant: plant,
    organization: 'SSWL',
  };

  const logs = AuditService.getAuditLogs(mockUser);

  return NextResponse.json({
    status: 'success',
    count: logs.length,
    data: logs,
  });
}
