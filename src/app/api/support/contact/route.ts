import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/support/contact
 * Crea un reporte de contacto/soporte genérico (usa el modelo BugReport).
 *
 * Body:
 * - name?: string
 * - email: string (obligatorio si no hay usuario autenticado)
 * - topic: "general" | "bug" | "improvement"
 * - message: string
 * - origin?: string
 * - url?: string
 * - context?: any
 * - website?: string (honeypot, debe venir vacío)
 * - openedAt?: number (timestamp ms en cliente, para validar tiempo mínimo)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      topic,
      message,
      origin,
      url,
      context,
      website,
      openedAt,
    } = body ?? {};

    // Honeypot
    if (typeof website === 'string' && website.trim().length > 0) {
      return NextResponse.json(
        {
          success: true,
          data: { ignored: true },
          message: 'Mensaje recibido.',
        },
        { status: 200 },
      );
    }

    // Tiempo mínimo (2s)
    if (typeof openedAt === 'number' && openedAt > 0) {
      const elapsed = Date.now() - openedAt;
      if (elapsed < 2000) {
        return NextResponse.json(
          {
            success: true,
            data: { ignored: true },
            message: 'Mensaje recibido.',
          },
          { status: 200 },
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
        { status: 400 },
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El mensaje es obligatorio.',
        },
        { status: 400 },
      );
    }

    const normalizedTopic =
      topic === 'bug' || topic === 'improvement' ? topic : 'general';

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
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creando contacto de soporte:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'No se pudo enviar tu mensaje. Intenta nuevamente más tarde.',
      },
      { status: 500 },
    );
  }
}

