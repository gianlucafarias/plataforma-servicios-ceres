import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CACHE_TTL_MS = 60_000;
let cachedCounts: Record<string, number> | null = null;
let cachedAt = 0;

// Returns counts of available services grouped by category slug.
export async function GET(_request: NextRequest) {
  try {
    const now = Date.now();
    if (cachedCounts && now - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json(
        { success: true, data: cachedCounts },
        { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
      );
    }

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
      cachedCounts = {};
      cachedAt = now;
      return NextResponse.json(
        { success: true, data: cachedCounts },
        { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
      );
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

    cachedCounts = countsBySlug;
    cachedAt = now;
    return NextResponse.json(
      { success: true, data: countsBySlug },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('GET /api/services/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}
