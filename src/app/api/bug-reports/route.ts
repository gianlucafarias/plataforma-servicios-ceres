import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueSlackAlert } from '@/jobs/slack.producer';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`bug-reports:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'rate_limited',
        message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.',
      },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json();
    const { title, description, severity = 'medium', userEmail, context } = body;

    if (!title || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Titulo y descripcion son requeridos',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Severidad invalida',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    let userId: string | null = null;
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      userId = user?.id || null;
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        severity,
        userEmail: userEmail || null,
        userId,
        context: context || null,
        status: 'open',
      },
    });

    try {
      await enqueueSlackAlert(
        `bug:${bugReport.id}`,
        `Nuevo bug reportado:\n*${title}*\nSeveridad: ${severity}\n${userEmail ? `Reportado por: ${userEmail}` : 'Reporte anonimo'}`
      );
    } catch (slackError) {
      console.error('Error enviando alerta a Slack:', slackError);
    }

    return NextResponse.json(
      {
        success: true,
        data: bugReport,
        message: 'Bug reportado exitosamente',
      },
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando bug report:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al reportar bug' },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
