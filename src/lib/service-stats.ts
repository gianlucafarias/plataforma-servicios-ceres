import { prisma } from '@/lib/prisma';
import { getPublicProfessionalWhere } from '@/lib/server/public-professional-visibility';

const CACHE_TTL_MS = 60_000;

let cachedCounts: Record<string, number> | null = null;
let cachedAt = 0;

export async function getServiceCountsByCategorySlug(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedCounts && now - cachedAt < CACHE_TTL_MS) {
    return cachedCounts;
  }

  const groups = await prisma.service.groupBy({
    by: ['categoryId'],
    _count: { _all: true },
    where: {
      available: true,
      professional: getPublicProfessionalWhere(),
    },
  });

  if (groups.length === 0) {
    cachedCounts = {};
    cachedAt = now;
    return cachedCounts;
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: groups.map((group) => group.categoryId) } },
    select: { id: true, slug: true },
  });

  const slugById = new Map(categories.map((category) => [category.id, category.slug]));

  const countsBySlug: Record<string, number> = {};
  for (const group of groups) {
    const slug = slugById.get(group.categoryId);
    if (!slug) {
      continue;
    }

    countsBySlug[slug] = group._count._all;
  }

  cachedCounts = countsBySlug;
  cachedAt = now;
  return countsBySlug;
}
