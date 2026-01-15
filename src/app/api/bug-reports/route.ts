import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueSlackAlert } from '@/jobs/slack.producer';

/**
 * POST /api/bug-reports
 * Endpoint público para reportar bugs
 * Body: { title, description, severity?, userEmail?, context? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, severity = 'medium', userEmail, context } = body;

    // Validaciones básicas
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Título y descripción son requeridos' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Severidad inválida' },
        { status: 400 }
      );
    }

    // Buscar usuario por email si se proporciona
    let userId: string | null = null;
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      });
      userId = user?.id || null;
    }

    // Crear bug report
    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        severity,
        userEmail: userEmail || null,
        userId,
        context: context || null,
        status: 'open',
      }
    });

    // Enviar notificación a Slack (en background)
    try {
      await enqueueSlackAlert(
        `bug:${bugReport.id}`,
        `🐛 Nuevo bug reportado:\n*${title}*\nSeveridad: ${severity}\n${userEmail ? `Reportado por: ${userEmail}` : 'Reporte anónimo'}`
      );
    } catch (slackError) {
      // No fallar si Slack falla
      console.error('Error enviando alerta a Slack:', slackError);
    }

    return NextResponse.json({
      success: true,
      data: bugReport,
      message: 'Bug reportado exitosamente'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando bug report:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al reportar bug' },
      { status: 500 }
    );
  }
}
