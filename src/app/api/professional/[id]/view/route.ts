import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint ligero para incrementar el contador de visitas al perfil.
// No requiere auth: se usa solo para estadísticas agregadas.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.professional.update({
      where: { id },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementando visitas de perfil:', error);
    // No exponemos detalles; para el cliente es un fallo silencioso
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}

