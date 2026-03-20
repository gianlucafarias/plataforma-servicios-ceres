import { NextRequest, NextResponse } from 'next/server';
import { listPublicProfessionals } from '@/lib/server/public-professionals';

export async function GET(request: NextRequest) {
  try {
    const result = await listPublicProfessionals(request.url);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener profesionales' },
      { status: 500 }
    );
  }
}
