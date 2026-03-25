import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getPublicProfessionalWhere } from '@/lib/server/public-professional-visibility';

export const PROFESSIONALS_LIST_RATE_LIMIT = {
  limit: 120,
  windowMs: 5 * 60 * 1000,
} as const;

type PublicProfessionalsOptions = {
  includeServiceLocations?: boolean;
};

export type PublicProfessionalsListResult = {
  data: Array<{
    id: string;
    user: {
      name: string;
    };
    bio: string | null;
    verified: boolean;
    primaryCategory: {
      name: string | undefined;
    };
    location: string | undefined;
    rating: number;
    reviewCount: number;
    ProfilePicture: string | undefined;
    whatsapp: string | undefined;
    phone: string | undefined;
    serviceLocations?: string[];
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type FeaturedHomeProfessional = PublicProfessionalsListResult['data'][number] & {
  serviceLocations: string[];
};

export async function listPublicProfessionals(
  url: string,
  options: PublicProfessionalsOptions = {}
): Promise<PublicProfessionalsListResult> {
  const { searchParams } = new URL(url);
  const q = searchParams.get('q') || undefined;
  const categoria = searchParams.get('categoria') || undefined;
  const grupo = searchParams.get('grupo') as 'oficios' | 'profesiones' | null;
  const location = searchParams.get('location') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
  const sortBy = (searchParams.get('sortBy') || 'recent') as 'name' | 'rating' | 'recent';

  const where: Prisma.ProfessionalWhereInput = {
    ...getPublicProfessionalWhere(),
  };

  if (grupo) {
    where.professionalGroup = grupo;
  }

  if (categoria) {
    where.services = {
      some: {
        category: { slug: categoria },
      },
    };
  }

  if (location && location !== 'all') {
    const locationFilter: Prisma.ProfessionalWhereInput = {
      OR: [
        { serviceLocations: { has: location } },
        { serviceLocations: { has: 'all-region' } },
        { location },
      ],
    };

    where.AND = Array.isArray(where.AND) ? [...where.AND, locationFilter] : [locationFilter];
  }

  if (q) {
    const searchFilter: Prisma.ProfessionalWhereInput = {
      OR: [
        { bio: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { user: { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { user: { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        { services: { some: { title: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
        {
          services: { some: { description: { contains: q, mode: Prisma.QueryMode.insensitive } } },
        },
        {
          services: {
            some: {
              category: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            },
          },
        },
      ],
    };

    where.AND = Array.isArray(where.AND) ? [...where.AND, searchFilter] : [searchFilter];
  }

  let orderBy: Prisma.ProfessionalOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortBy === 'name') {
    orderBy = { user: { firstName: 'asc' } };
  } else if (sortBy === 'rating') {
    orderBy = { rating: 'desc' };
  }

  const [total, rows] = await Promise.all([
    prisma.professional.count({ where }),
    prisma.professional.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        bio: true,
        verified: true,
        rating: true,
        reviewCount: true,
        location: true,
        ProfilePicture: true,
        whatsapp: true,
        serviceLocations: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            verified: true,
            image: true,
            location: true,
            phone: true,
          },
        },
        services: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: { category: { select: { name: true } } },
        },
      },
    }),
  ]);

  return {
    data: rows.map((professional) => ({
      id: professional.id,
      user: {
        name: `${professional.user.firstName} ${professional.user.lastName}`.trim(),
      },
      bio: professional.bio,
      verified: professional.verified,
      primaryCategory: {
        name: professional.services[0]?.category?.name ?? undefined,
      },
      location: professional.location ?? professional.user.location ?? undefined,
      rating: professional.rating ?? 0,
      reviewCount: professional.reviewCount ?? 0,
      ProfilePicture: professional.ProfilePicture || professional.user.image || undefined,
      whatsapp: professional.whatsapp || undefined,
      phone: professional.user.phone || undefined,
      ...(options.includeServiceLocations
        ? {
            serviceLocations: professional.serviceLocations ?? [],
          }
        : {}),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

const listFeaturedHomeProfessionalsCached = unstable_cache(
  async (limit: number): Promise<FeaturedHomeProfessional[]> => {
    const result = await listPublicProfessionals(
      `https://ceres.local/api/v1/professionals?grupo=oficios&limit=${limit}&sortBy=recent`,
      {
        includeServiceLocations: true,
      }
    );

    return result.data.map((professional) => ({
      ...professional,
      serviceLocations: professional.serviceLocations ?? [],
    }));
  },
  ['home-featured-professionals'],
  {
    revalidate: 300,
  }
);

export async function listFeaturedHomeProfessionals(limit = 24) {
  return listFeaturedHomeProfessionalsCached(limit);
}
