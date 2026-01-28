import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/support/category-suggestions
 * Crea un ticket de sugerencia de categoría.
 *
 * Body:
 * - suggestedName: string (obligatorio)
 * - description?: string
 * - email: string (obligatorio si no se asocia a un usuario)
 * - userId?: string
 * - origin?: string
 * - url?: string
 * - context?: any (JSON serializable)
 * - relatedCategoryId?: string
 * - perspective?: "provider" | "seeker"
 * - website?: string (honeypot, debe venir vacío)
 * - openedAt?: number (timestamp ms en cliente, para validar tiempo mínimo)
 */
export async function POST(request: NextRequest) {
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

    // Honeypot: si el campo "website" viene relleno, probablemente sea un bot.
    if (typeof website === 'string' && website.trim().length > 0) {
      // Respondemos como éxito pero sin crear nada para no dar pistas.
      return NextResponse.json(
        {
          success: true,
          data: { ignored: true },
          message: 'Sugerencia registrada.',
        },
        { status: 200 },
      );
    }

    // Tiempo mínimo entre abrir el modal y enviar (p.ej. 2 segundos)
    if (typeof openedAt === 'number' && openedAt > 0) {
      const elapsed = Date.now() - openedAt;
      if (elapsed < 2000) {
        return NextResponse.json(
          {
            success: true,
            data: { ignored: true },
            message: 'Sugerencia registrada.',
          },
          { status: 200 },
        );
      }
    }

    if (!suggestedName || typeof suggestedName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El nombre de la categoría sugerida es obligatorio.',
        },
        { status: 400 },
      );
    }

    if (!userId && (!email || typeof email !== 'string')) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'Debe proporcionar un email si no hay usuario autenticado.',
        },
        { status: 400 },
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
        message: 'Sugerencia de categoría registrada correctamente.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creando sugerencia de categoría:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'No se pudo registrar la sugerencia de categoría.',
      },
      { status: 500 },
    );
  }
}

