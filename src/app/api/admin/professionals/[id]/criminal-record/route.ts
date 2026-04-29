import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

const VALID_STATUSES = new Set(['approved', 'rejected']);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const status = body?.status;
    const adminNotes = typeof body?.adminNotes === 'string' ? body.adminNotes.trim() : null;

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Estado invalido. Debe ser "approved" o "rejected".',
        },
        { status: 400 }
      );
    }

    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        id: true,
        documentation: {
          select: {
            id: true,
            criminalRecordObjectKey: true,
          },
        },
      },
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    if (!professional.documentation?.criminalRecordObjectKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El profesional no tiene un certificado de antecedentes cargado.',
        },
        { status: 400 }
      );
    }

    const reviewedAt = new Date();

    const [documentation] = await prisma.$transaction([
      prisma.professionalDocumentation.update({
        where: { professionalId: professional.id },
        data: {
          criminalRecordStatus: status,
          criminalRecordReviewedAt: reviewedAt,
          criminalRecordAdminNotes: adminNotes || null,
        },
      }),
      prisma.professional.update({
        where: { id: professional.id },
        data: {
          verified: status === 'approved',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: documentation,
      message:
        status === 'approved'
          ? 'Antecedentes aprobados y profesional verificado.'
          : 'Antecedentes rechazados y profesional marcado sin verificar.',
    });
  } catch (routeError) {
    console.error('Error revisando antecedentes del profesional:', routeError);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'Error al revisar antecedentes del profesional.',
      },
      { status: 500 }
    );
  }
}
