import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

// GET: Obtener certificaciones del profesional actual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'unauthorized' 
      }, { status: 401 });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!professional) {
      return NextResponse.json({ 
        success: false, 
        error: 'not_found',
        message: 'Profesional no encontrado'
      }, { status: 404 });
    }

    const certifications = await prisma.professionalCertification.findMany({
      where: { professionalId: professional.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: certifications
    });
  } catch (error) {
    console.error('Error obteniendo certificaciones:', error);
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// POST: Crear nueva certificación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'unauthorized' 
      }, { status: 401 });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!professional) {
      return NextResponse.json({ 
        success: false, 
        error: 'not_found',
        message: 'Profesional no encontrado'
      }, { status: 404 });
    }

    const body = await request.json();
    const {
      categoryId,
      certificationType,
      certificationNumber,
      issuingOrganization,
      issueDate,
      expiryDate,
      documentUrl
    } = body;

    // Validaciones
    if (!certificationType || !certificationNumber || !issuingOrganization) {
      return NextResponse.json({
        success: false,
        error: 'validation_error',
        message: 'Faltan campos requeridos: tipo, número y organización emisora'
      }, { status: 400 });
    }

    const certification = await prisma.professionalCertification.create({
      data: {
        professionalId: professional.id,
        categoryId: categoryId || null,
        certificationType,
        certificationNumber,
        issuingOrganization,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        documentUrl: documentUrl || null,
        status: 'pending'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: certification,
      message: 'Certificación enviada para revisión'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando certificación:', error);
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
