import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/bug-reports
 * Lista bug reports con filtros y paginación
 * Query params: page, limit, status, severity, search
 */
export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') as 'open' | 'in_progress' | 'resolved' | 'closed' | null;
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null;
    const search = searchParams.get('search') || undefined;

    const where: Prisma.BugReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { userEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { adminNotes: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [total, bugReports] = await Promise.all([
      prisma.bugReport.count({ where }),
      prisma.bugReport.findMany({
        where,
        orderBy: [
          { severity: 'desc' }, // Críticos primero
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        },
      })
    ]);

    const data = bugReports.map(br => ({
      id: br.id,
      title: br.title,
      description: br.description,
      status: br.status,
      severity: br.severity,
      userEmail: br.userEmail,
      userId: br.userId,
      user: br.user,
      context: br.context,
      adminNotes: br.adminNotes,
      resolvedAt: br.resolvedAt,
      createdAt: br.createdAt,
      updatedAt: br.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo bug reports (admin):', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener bug reports' },
      { status: 500 }
    );
  }
}
