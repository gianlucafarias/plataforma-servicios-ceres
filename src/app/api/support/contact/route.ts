import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`support-contact:${clientIp(request)}`, LIMIT, WINDOW_MS);
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
    const { name, email, topic, message, origin, url, context, website, openedAt } = body ?? {};

    if (typeof website === 'string' && website.trim().length > 0) {
      return NextResponse.json(
        {
          success: true,
          data: { ignored: true },
          message: 'Mensaje recibido.',
        },
        { status: 200, headers: rateLimitHeaders(rl) }
      );
    }

    if (typeof openedAt === 'number' && openedAt > 0) {
      const elapsed = Date.now() - openedAt;
      if (elapsed < 2000) {
        return NextResponse.json(
          {
            success: true,
            data: { ignored: true },
            message: 'Mensaje recibido.',
          },
          { status: 200, headers: rateLimitHeaders(rl) }
        );
      }
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El email es obligatorio.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El mensaje es obligatorio.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const normalizedTopic = topic === 'bug' || topic === 'improvement' ? topic : 'general';
    const severity =
      normalizedTopic === 'bug' ? 'high' : normalizedTopic === 'improvement' ? 'medium' : 'low';
    const titleBase =
      normalizedTopic === 'bug'
        ? 'Reporte de problema desde la web'
        : normalizedTopic === 'improvement'
          ? 'Sugerencia de mejora desde la web'
          : 'Consulta general desde la web';

    const safeName =
      typeof name === 'string' && name.trim().length > 0
        ? name.trim().slice(0, 80)
        : null;

    const report = await prisma.bugReport.create({
      data: {
        title: titleBase,
        description: message.trim().slice(0, 4000),
        status: 'open',
        severity,
        userEmail: email.trim().slice(0, 120),
        context: {
          origin: typeof origin === 'string' ? origin : undefined,
          url: typeof url === 'string' ? url : undefined,
          topic: normalizedTopic,
          name: safeName ?? undefined,
          extra: context ?? undefined,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: report.id },
        message: 'Tu mensaje fue enviado. Gracias por contactarnos.',
      },
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando contacto de soporte:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'No se pudo enviar tu mensaje. Intenta nuevamente mas tarde.',
      },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
