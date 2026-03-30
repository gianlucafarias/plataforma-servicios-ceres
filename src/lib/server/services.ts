import { CategoryGroupId, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ObservabilityActor } from '@/lib/observability/context';
import { buildChanges, safeRecordAuditEvent } from '@/lib/observability/audit';
import { getServiceCountsByCategorySlug } from '@/lib/service-stats';
import { getPublicProfessionalWhere } from '@/lib/server/public-professional-visibility';
import {
  AREAS_OFICIOS,
  SUBCATEGORIES_OFICIOS,
  SUBCATEGORIES_PROFESIONES,
} from '@/lib/taxonomy';

export const SERVICES_LIST_RATE_LIMIT = {
  limit: 200,
  windowMs: 5 * 60 * 1000,
} as const;

export const SERVICES_WRITE_RATE_LIMIT = {
  limit: 40,
  windowMs: 10 * 60 * 1000,
} as const;

export const SERVICES_STATS_RATE_LIMIT = {
  limit: 120,
  windowMs: 5 * 60 * 1000,
} as const;

type ServiceGroup = 'oficios' | 'profesiones';

type CreateServicePayload = {
  title?: unknown;
  description?: unknown;
  categorySlug?: unknown;
  priceRange?: unknown;
};

type UpdateServicePayload = {
  title?: unknown;
  description?: unknown;
  priceRange?: unknown;
  available?: unknown;
};

type ServiceMutationObservability = {
  requestId?: string | null;
  actor?: ObservabilityActor;
  route?: string | null;
  method?: string | null;
};

type ListedService = {
  id: string;
  title: string;
  description: string;
  priceRange: string | null;
  professional: {
    id: string;
    location: string | null;
    whatsapp: string | null;
    phone: string | null;
    user: {
      name: string;
      location: string | null;
    };
    rating: number;
    reviewCount: number;
    verified: boolean;
    ProfilePicture: string | null;
  };
  category: {
    name: string;
  };
};

function categoryAuditSnapshot(category: {
  id: string;
  name: string;
  slug: string;
  groupId: string;
  parentCategoryId: string | null;
  active: boolean;
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    groupId: category.groupId,
    parentCategoryId: category.parentCategoryId,
    active: category.active,
  };
}

function serviceAuditSnapshot(service: {
  id: string;
  professionalId: string;
  categoryId: string;
  categoryGroup: CategoryGroupId | null;
  title: string;
  description: string;
  priceRange: string | null;
  available: boolean;
  category?: {
    name: string;
    slug?: string;
  } | null;
}) {
  return {
    id: service.id,
    professionalId: service.professionalId,
    categoryId: service.categoryId,
    categoryGroup: service.categoryGroup,
    categoryName: service.category?.name ?? null,
    categorySlug: service.category?.slug ?? null,
    title: service.title,
    description: service.description,
    priceRange: service.priceRange,
    available: service.available,
  };
}

export type ListedServicesPage = {
  data: ListedService[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class ServiceFlowError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeServiceGroup(value: string | null): ServiceGroup | null {
  if (value === 'oficios' || value === 'profesiones') {
    return value;
  }

  return null;
}

function resolveCategorySlugFromQuery(query: string): { slug: string; group: ServiceGroup } | null {
  const normalized = query.toLowerCase();
  const allTaxonomy = [...SUBCATEGORIES_OFICIOS, ...SUBCATEGORIES_PROFESIONES];
  const match = allTaxonomy.find(
    (subcategory) =>
      subcategory.name.toLowerCase().includes(normalized) ||
      subcategory.slug.toLowerCase().includes(normalized)
  );

  if (!match) {
    return null;
  }

  return {
    slug: match.slug,
    group: match.group as ServiceGroup,
  };
}

function applyCategoryFilter(where: Prisma.ServiceWhereInput, categorySlug: string) {
  const areaMatch = AREAS_OFICIOS.find((area) => area.slug === categorySlug);

  if (!areaMatch) {
    where.category = { slug: categorySlug };
    return;
  }

  const subSlugs = SUBCATEGORIES_OFICIOS.filter((subcategory) => subcategory.areaSlug === areaMatch.slug).map(
    (subcategory) => subcategory.slug
  );

  where.category = subSlugs.length > 0 ? { slug: { in: subSlugs } } : { slug: categorySlug };
}

async function resolveServiceCategory(
  categorySlug: string,
  observability?: ServiceMutationObservability,
) {
  let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (category) {
    return category;
  }

  const allTaxonomy = [...SUBCATEGORIES_OFICIOS, ...SUBCATEGORIES_PROFESIONES];
  const match = allTaxonomy.find((item) => item.slug === categorySlug);
  if (!match) {
    throw new ServiceFlowError('category_not_found', 'Categoria no encontrada', 404);
  }

  category = await prisma.category.create({
    data: {
      name: match.name,
      description: match.name,
      slug: match.slug,
      active: true,
      group: { connect: { id: match.group } },
    },
  });

  await safeRecordAuditEvent({
    kind: 'audit',
    domain: 'services.catalog',
    eventName: 'category.auto_created',
    status: 'success',
    summary: `Categoria ${category.slug} creada automaticamente durante flujo de servicios`,
    actor: observability?.actor,
    requestId: observability?.requestId,
    route: observability?.route,
    method: observability?.method,
    entityType: 'category',
    entityId: category.id,
    changes: buildChanges(null, categoryAuditSnapshot(category)),
    metadata: {
      source: 'service_flow',
    },
  });

  return category;
}

async function ensureOwnedService(serviceId: string, userId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      professional: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!service) {
    throw new ServiceFlowError('not_found', 'Servicio no encontrado', 404);
  }

  if (service.professional.userId !== userId) {
    throw new ServiceFlowError('forbidden', 'No autorizado para modificar este servicio', 403);
  }

  return service;
}

export async function listPublicServices(url: string): Promise<ListedServicesPage> {
  const { searchParams } = new URL(url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const q = (searchParams.get('q') || '').trim();

  let grupo = normalizeServiceGroup(searchParams.get('grupo'));
  const subcategoriaSlug = searchParams.get('subcategoria');
  let categoriaSlug = searchParams.get('categoria') || null;
  const location = searchParams.get('location') || null;

  if (subcategoriaSlug) {
    categoriaSlug = subcategoriaSlug;
  }

  if (q && !categoriaSlug) {
    const matchedCategory = resolveCategorySlugFromQuery(q);
    if (matchedCategory) {
      categoriaSlug = matchedCategory.slug;
      if (!grupo) {
        grupo = matchedCategory.group;
      }
    }
  }

  const where: Prisma.ServiceWhereInput = {
    available: true,
    professional: getPublicProfessionalWhere(),
  };

  if (grupo) {
    const baseProfessional = (where.professional as Prisma.ProfessionalWhereInput) || {};
    where.professional = {
      ...baseProfessional,
      professionalGroup:
        grupo === 'oficios' ? CategoryGroupId.oficios : CategoryGroupId.profesiones,
    };
  }

  if (categoriaSlug) {
    applyCategoryFilter(where, categoriaSlug);
  }

  if (location && location !== 'all') {
    const baseProfessional = (where.professional as Prisma.ProfessionalWhereInput) || {};
    where.professional = {
      ...baseProfessional,
      OR: [
        { serviceLocations: { has: location } },
        { serviceLocations: { has: 'all-region' } },
        { location },
      ],
    };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
      {
        professional: {
          user: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      },
    ];
  }

  const [total, services] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      include: {
        category: { select: { name: true } },
        professional: {
          select: {
            id: true,
            location: true,
            verified: true,
            rating: true,
            reviewCount: true,
            ProfilePicture: true,
            whatsapp: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                verified: true,
                location: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
  ]);

  return {
    data: services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      priceRange: service.priceRange,
      professional: {
        id: service.professional.id,
        location: service.professional.location ?? service.professional.user.location ?? null,
        whatsapp: service.professional.whatsapp ?? null,
        phone: service.professional.user.phone ?? null,
        user: {
          name: `${service.professional.user.firstName} ${service.professional.user.lastName}`.trim(),
          location: service.professional.user.location ?? null,
        },
        rating: service.professional.rating ?? 0,
        reviewCount: service.professional.reviewCount ?? 0,
        verified: service.professional.verified,
        ProfilePicture: service.professional.ProfilePicture ?? null,
      },
      category: {
        name: service.category.name,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createServiceForUser(
  userId: string,
  payload: CreateServicePayload,
  observability?: ServiceMutationObservability,
) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const categorySlug =
    typeof payload.categorySlug === 'string' ? payload.categorySlug.trim() : '';
  const priceRange = typeof payload.priceRange === 'string' ? payload.priceRange : '';

  if (!title || !description || !categorySlug) {
    throw new ServiceFlowError('invalid_body', 'Faltan campos requeridos', 400);
  }

  const professional = await prisma.professional.findUnique({
    where: { userId },
  });

  if (!professional) {
    throw new ServiceFlowError('no_professional', 'Perfil profesional no encontrado', 404);
  }

  const category = await resolveServiceCategory(categorySlug, observability);

  const created = await prisma.service.create({
    data: {
      professionalId: professional.id,
      categoryId: category.id,
      categoryGroup: professional.professionalGroup ?? null,
      title,
      description,
      priceRange,
      available: true,
    },
    include: {
      category: { select: { name: true, slug: true } },
    },
  });

  await safeRecordAuditEvent({
    kind: 'audit',
    domain: 'services',
    eventName: 'service.create',
    status: 'success',
    summary: `Servicio ${created.id} creado por usuario ${userId}`,
    actor: observability?.actor,
    requestId: observability?.requestId,
    route: observability?.route,
    method: observability?.method,
    entityType: 'service',
    entityId: created.id,
    changes: buildChanges(null, serviceAuditSnapshot(created)),
    metadata: {
      ownerUserId: userId,
    },
  });

  return created;
}

export async function updateOwnedService(
  serviceId: string,
  userId: string,
  payload: UpdateServicePayload,
  observability?: ServiceMutationObservability,
) {
  const existing = await ensureOwnedService(serviceId, userId);

  const data: Record<string, unknown> = {};
  if (typeof payload.title === 'string') {
    data.title = payload.title;
  }
  if (typeof payload.description === 'string') {
    data.description = payload.description;
  }
  if (typeof payload.priceRange === 'string') {
    data.priceRange = payload.priceRange;
  }
  if (typeof payload.available === 'boolean') {
    data.available = payload.available;
  }

  if (Object.keys(data).length === 0) {
    throw new ServiceFlowError('no_fields', 'No hay campos validos para actualizar', 400);
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data,
    include: {
      category: { select: { name: true, slug: true } },
      professional: {
        select: {
          id: true,
          verified: true,
          rating: true,
          reviewCount: true,
          user: { select: { firstName: true, lastName: true, verified: true } },
        },
      },
    },
  });

  await safeRecordAuditEvent({
    kind: 'audit',
    domain: 'services',
    eventName: 'service.update',
    status: 'success',
    summary: `Servicio ${serviceId} actualizado por usuario ${userId}`,
    actor: observability?.actor,
    requestId: observability?.requestId,
    route: observability?.route,
    method: observability?.method,
    entityType: 'service',
    entityId: updated.id,
    changes: buildChanges(
      serviceAuditSnapshot(existing),
      serviceAuditSnapshot(updated),
    ),
    metadata: {
      ownerUserId: userId,
    },
  });

  return updated;
}

export async function deleteOwnedService(
  serviceId: string,
  userId: string,
  observability?: ServiceMutationObservability,
) {
  const existing = await ensureOwnedService(serviceId, userId);
  await prisma.service.delete({ where: { id: serviceId } });

  await safeRecordAuditEvent({
    kind: 'audit',
    domain: 'services',
    eventName: 'service.delete',
    status: 'success',
    summary: `Servicio ${serviceId} eliminado por usuario ${userId}`,
    actor: observability?.actor,
    requestId: observability?.requestId,
    route: observability?.route,
    method: observability?.method,
    entityType: 'service',
    entityId: serviceId,
    changes: buildChanges(serviceAuditSnapshot(existing), null),
    metadata: {
      ownerUserId: userId,
    },
  });
}

export async function getServiceCounts() {
  return getServiceCountsByCategorySlug();
}
