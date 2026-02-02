import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueSlackAlert } from '@/jobs/slack.producer';
import { fail, ok, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const LIMIT = 20; // requests
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const ip = clientIp(request);
  const rl = rateLimit(`bug:${ip}`, LIMIT, WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const body = await request.json();
    const { title, description, severity = 'medium', userEmail, context } = body ?? {};

    if (!title || !description) {
      return NextResponse.json(
        fail('validation_error', 'Título y descripción son requeridos', undefined, meta),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        fail('validation_error', 'Severidad inválida', { allowed: ['low', 'medium', 'high', 'critical'] }, meta),
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

    // Best-effort notification
    enqueueSlackAlert(
      `bug:${bugReport.id}`,
      `🐛 Nuevo bug reportado:\n*${title}*\nSeveridad: ${severity}\n${userEmail ? `Reportado por: ${userEmail}` : 'Reporte anónimo'}`
    ).catch((slackError) => {
      console.error('Error enviando alerta a Slack:', slackError);
    });

    return NextResponse.json(
      ok(
        bugReport,
        {
          ...meta,
          pagination: undefined,
        }
      ),
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando bug report (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Error al reportar bug', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
