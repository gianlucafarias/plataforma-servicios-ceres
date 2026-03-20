import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';
import { clientIp } from '@/lib/request-helpers';
import {
  CATEGORY_SUGGESTION_RATE_LIMIT,
  createCategorySuggestionSubmission,
  validateCategorySuggestionPayload,
} from '@/lib/server/support-submissions';

export async function POST(request: NextRequest) {
  const rl = rateLimit(
    `category-suggestion:${clientIp(request)}`,
    CATEGORY_SUGGESTION_RATE_LIMIT.limit,
    CATEGORY_SUGGESTION_RATE_LIMIT.windowMs
  );
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
    const validation = validateCategorySuggestionPayload(body);

    if (validation.kind === 'ignored') {
      return NextResponse.json(
        {
          success: true,
          data: { ignored: true },
          message: validation.message,
        },
        { status: 200, headers: rateLimitHeaders(rl) }
      );
    }

    if (validation.kind === 'error') {
      return NextResponse.json(
        {
          success: false,
          error: validation.code,
          message: validation.message,
        },
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const suggestion = await createCategorySuggestionSubmission(validation.data);

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
