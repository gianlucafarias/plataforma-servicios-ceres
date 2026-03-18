import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rl = rateLimit(`category-suggestion:${clientIp(request)}`, LIMIT, WINDOW_MS);
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
    const {
      suggestedName,
      description,
      email,
      userId,
      origin,
      url,
      context,
      relatedCategoryId,
      perspective,
      website,
      openedAt,
    } = body ?? {};

    if (typeof website === 'string' && website.trim().length > 0) {
      return NextResponse.json(
        {
          success: true,
          data: { ignored: true },
          message: 'Sugerencia registrada.',
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
            message: 'Sugerencia registrada.',
          },
          { status: 200, headers: rateLimitHeaders(rl) }
        );
      }
    }

    if (!suggestedName || typeof suggestedName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El nombre de la categoria sugerida es obligatorio.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    if (!userId && (!email || typeof email !== 'string')) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Debe proporcionar un email si no hay usuario autenticado.',
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const suggestion = await prisma.categorySuggestion.create({
      data: {
        title: suggestedName.trim().slice(0, 150),
        description:
          typeof description === 'string'
            ? description.trim().slice(0, 2000)
            : null,
        status: 'open',
        userId: typeof userId === 'string' ? userId : null,
        userEmail: typeof email === 'string' ? email.trim() : null,
        origin: typeof origin === 'string' ? origin : null,
        url: typeof url === 'string' ? url : null,
        context: context ?? undefined,
        relatedCategoryId:
          typeof relatedCategoryId === 'string' && relatedCategoryId.length > 0
            ? relatedCategoryId
            : null,
        perspective:
          perspective === 'provider' || perspective === 'seeker'
            ? perspective
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: suggestion.id,
        },
        message: 'Sugerencia de categoria registrada correctamente.',
      },
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error creando sugerencia de categoria:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'No se pudo registrar la sugerencia de categoria.',
      },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
