import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Devuelve la cantidad de servicios disponibles (profesionales activos y verificados)
// agrupados por slug de categoría (subcategorías). Pensado para mostrar contadores
// en el sidebar sin hacer N consultas.
export async function GET(_request: NextRequest) {
  try {
    // Agrupamos en la tabla de servicios para contar solo los que están disponibles
    const groups = await prisma.service.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: {
        available: true,
        professional: {
          status: 'active',
          user: { verified: true },
        },
      },
    });

    if (groups.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const categoryIds = groups.map((g) => g.categoryId);

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, slug: true },
    });

    const slugById = new Map(categories.map((c) => [c.id, c.slug]));

    const countsBySlug: Record<string, number> = {};
    for (const g of groups) {
      const slug = slugById.get(g.categoryId);
      if (!slug) continue;
      countsBySlug[slug] = g._count._all;
    }

    return NextResponse.json({ success: true, data: countsBySlug });
  } catch (error) {
    console.error('GET /api/services/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}

