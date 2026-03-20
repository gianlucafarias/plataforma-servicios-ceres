import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';

export type ProfessionalScheduleSlot = {
  enabled: boolean;
  start: string;
  end: string;
};

export type ProfessionalScheduleDay = {
  fullDay?: boolean;
  morning?: ProfessionalScheduleSlot;
  afternoon?: ProfessionalScheduleSlot;
  workOnHolidays?: boolean;
};

export type ProfessionalSchedule = Record<string, ProfessionalScheduleDay>;

type RegistrationType = 'email' | 'google' | 'facebook';

const professionalDashboardArgs = Prisma.validator<Prisma.ProfessionalDefaultArgs>()({
  select: {
    id: true,
    status: true,
    bio: true,
    experienceYears: true,
    verified: true,
    rating: true,
    reviewCount: true,
    specialties: true,
    professionalGroup: true,
    whatsapp: true,
    instagram: true,
    facebook: true,
    linkedin: true,
    website: true,
    portfolio: true,
    CV: true,
    ProfilePicture: true,
    location: true,
    serviceLocations: true,
    hasPhysicalStore: true,
    physicalStoreAddress: true,
    schedule: true,
    user: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        verified: true,
        birthDate: true,
        location: true,
      },
    },
    services: {
      orderBy: { createdAt: 'asc' },
      include: {
        category: { select: { name: true } },
      },
    },
  },
});

type ProfessionalDashboardRecord = Prisma.ProfessionalGetPayload<typeof professionalDashboardArgs>;

export type ProfessionalDashboardProfile = {
  id: string;
  status: 'pending' | 'active' | 'suspended';
  bio: string;
  experienceYears: number | null;
  verified: boolean;
  rating: number | null;
  reviewCount: number | null;
  specialties: string[];
  professionalGroup: 'oficios' | 'profesiones' | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  portfolio: string | null;
  CV: string | null;
  ProfilePicture: string | null;
  location: string | null;
  serviceLocations: string[];
  hasPhysicalStore: boolean;
  physicalStoreAddress: string | null;
  schedule: ProfessionalSchedule | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    verified: boolean;
    birthDate: string | null;
    location: string | null;
  };
  services: Array<{
    id: string;
    professionalId: string;
    categoryId: string;
    categoryGroup: 'oficios' | 'profesiones' | null;
    title: string;
    description: string;
    priceRange: string;
    available: boolean;
    createdAt: Date;
    updatedAt: Date;
    category: {
      name: string;
    };
  }>;
  registrationType: RegistrationType;
};

export class ProfessionalDashboardError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeSchedule(value: Prisma.JsonValue | null): ProfessionalSchedule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as unknown as ProfessionalSchedule;
}

async function getRegistrationType(userId: string): Promise<RegistrationType> {
  const account = await prisma.account.findFirst({
    where: { userId },
    select: { provider: true },
  });

  if (account?.provider === 'google') {
    return 'google';
  }

  if (account?.provider === 'facebook') {
    return 'facebook';
  }

  return 'email';
}

function serializeProfessionalDashboard(
  record: ProfessionalDashboardRecord,
  registrationType: RegistrationType
): ProfessionalDashboardProfile {
  return {
    id: record.id,
    status: record.status,
    bio: record.bio,
    experienceYears: record.experienceYears,
    verified: record.verified,
    rating: record.rating,
    reviewCount: record.reviewCount,
    specialties: record.specialties,
    professionalGroup: record.professionalGroup,
    whatsapp: record.whatsapp,
    instagram: record.instagram,
    facebook: record.facebook,
    linkedin: record.linkedin,
    website: record.website,
    portfolio: record.portfolio,
    CV: record.CV,
    ProfilePicture: record.ProfilePicture,
    location: record.location,
    serviceLocations: record.serviceLocations,
    hasPhysicalStore: record.hasPhysicalStore,
    physicalStoreAddress: record.physicalStoreAddress,
    schedule: normalizeSchedule(record.schedule),
    user: {
      firstName: record.user.firstName,
      lastName: record.user.lastName,
      email: record.user.email,
      phone: record.user.phone,
      verified: record.user.verified,
      birthDate: record.user.birthDate ? record.user.birthDate.toISOString() : null,
      location: record.user.location,
    },
    services: record.services.map((service) => ({
      id: service.id,
      professionalId: service.professionalId,
      categoryId: service.categoryId,
      categoryGroup: service.categoryGroup,
      title: service.title,
      description: service.description,
      priceRange: service.priceRange,
      available: service.available,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      category: {
        name: service.category.name,
      },
    })),
    registrationType,
  };
}

async function getProfessionalIdByUserId(userId: string): Promise<string | null> {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { id: true },
  });

  return professional?.id ?? null;
}

function hasField<T extends object>(value: T, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function ensureNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ProfessionalDashboardError(
      'validation_error',
      `${field} es obligatorio`,
      400
    );
  }

  return value.trim();
}

function parseExperienceYears(value: unknown): number {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number.parseInt(value, 10)
        : 0;

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ProfessionalDashboardError(
      'validation_error',
      'Los anos de experiencia son invalidos',
      400
    );
  }

  return numeric;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function getProfessionalDashboardProfile(
  userId: string
): Promise<ProfessionalDashboardProfile | null> {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    ...professionalDashboardArgs,
  });

  if (!professional) {
    return null;
  }

  const registrationType = await getRegistrationType(userId);
  return serializeProfessionalDashboard(professional, registrationType);
}

export async function updateProfessionalDashboardProfile(
  userId: string,
  payload: unknown
): Promise<ProfessionalDashboardProfile | null> {
  const body = (payload ?? {}) as Record<string, unknown>;
  const professionalId = await getProfessionalIdByUserId(userId);

  if (!professionalId) {
    return null;
  }

  const now = new Date();
  const userData: Prisma.UserUpdateInput = {};
  const professionalData: Prisma.ProfessionalUpdateInput = {};
  const hasPhysicalStoreField = hasField(body, 'hasPhysicalStore');
  const hasPhysicalStoreValue = hasPhysicalStoreField ? Boolean(body.hasPhysicalStore) : undefined;

  if (hasField(body, 'firstName')) {
    userData.firstName = ensureNonEmptyString(body.firstName, 'Nombre');
  }

  if (hasField(body, 'lastName')) {
    userData.lastName = ensureNonEmptyString(body.lastName, 'Apellido');
  }

  if (hasField(body, 'email')) {
    userData.email = ensureNonEmptyString(body.email, 'Email');
  }

  if (hasField(body, 'phone')) {
    userData.phone = normalizeOptionalString(body.phone);
  }

  if (hasField(body, 'birthDate')) {
    userData.birthDate =
      body.birthDate && typeof body.birthDate === 'string'
        ? new Date(body.birthDate)
        : null;
  }

  if (hasField(body, 'location')) {
    const location = normalizeOptionalString(body.location);
    userData.location = location;
    professionalData.location = location;
  }

  if (hasField(body, 'bio')) {
    professionalData.bio = typeof body.bio === 'string' ? body.bio : '';
  }

  if (hasField(body, 'experienceYears')) {
    professionalData.experienceYears = parseExperienceYears(body.experienceYears);
  }

  if (hasField(body, 'specialties') && Array.isArray(body.specialties)) {
    professionalData.specialties = body.specialties.filter(
      (value): value is string => typeof value === 'string'
    );
  } else if (hasField(body, 'specialty')) {
    const specialty = normalizeOptionalString(body.specialty);
    professionalData.specialties = specialty ? [specialty] : [];
  }

  if (hasField(body, 'professionalGroup')) {
    professionalData.professionalGroup =
      body.professionalGroup === 'oficios' || body.professionalGroup === 'profesiones'
        ? body.professionalGroup
        : null;
  }

  if (hasField(body, 'whatsapp')) {
    professionalData.whatsapp = normalizeWhatsAppNumber(
      typeof body.whatsapp === 'string' ? body.whatsapp : ''
    );
  }

  if (hasField(body, 'instagram')) {
    professionalData.instagram = normalizeOptionalString(body.instagram);
  }

  if (hasField(body, 'facebook')) {
    professionalData.facebook = normalizeOptionalString(body.facebook);
  }

  if (hasField(body, 'linkedin')) {
    professionalData.linkedin = normalizeOptionalString(body.linkedin);
  }

  if (hasField(body, 'website')) {
    professionalData.website = normalizeOptionalString(body.website);
  }

  if (hasField(body, 'portfolio')) {
    professionalData.portfolio = normalizeOptionalString(body.portfolio);
  }

  if (hasField(body, 'cv')) {
    professionalData.CV = normalizeOptionalString(body.cv);
  }

  if (hasField(body, 'picture')) {
    professionalData.ProfilePicture = normalizeOptionalString(body.picture);
  }

  if (hasField(body, 'serviceLocations') && Array.isArray(body.serviceLocations)) {
    professionalData.serviceLocations = body.serviceLocations.filter(
      (value): value is string => typeof value === 'string'
    );
  }

  if (hasPhysicalStoreField) {
    professionalData.hasPhysicalStore = hasPhysicalStoreValue;
    if (!hasPhysicalStoreValue) {
      professionalData.physicalStoreAddress = null;
    }
  }

  if (hasField(body, 'physicalStoreAddress')) {
    professionalData.physicalStoreAddress =
      hasPhysicalStoreValue === false ? null : normalizeOptionalString(body.physicalStoreAddress);
  }

  if (hasField(body, 'schedule')) {
    professionalData.schedule =
      body.schedule == null ? Prisma.DbNull : (body.schedule as Prisma.InputJsonValue);
  }

  if (Object.keys(userData).length === 0 && Object.keys(professionalData).length === 0) {
    return getProfessionalDashboardProfile(userId);
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...userData,
          updatedAt: now,
        },
      });
    }

    if (Object.keys(professionalData).length > 0) {
      await tx.professional.update({
        where: { userId },
        data: {
          ...professionalData,
          updatedAt: now,
        },
      });
    }
  });

  return getProfessionalDashboardProfile(userId);
}

export async function getProfessionalStats(userId: string) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: {
      id: true,
      rating: true,
      reviewCount: true,
      verified: true,
      status: true,
      experienceYears: true,
      serviceLocations: true,
      profileViews: true,
      createdAt: true,
      _count: {
        select: {
          services: true,
          reviews: true,
        },
      },
    },
  });

  if (!professional) {
    return null;
  }

  const [activeServices, totalServices] = await Promise.all([
    prisma.service.count({
      where: { professionalId: professional.id, available: true },
    }),
    prisma.service.count({
      where: { professionalId: professional.id },
    }),
  ]);

  return {
    services: {
      active: activeServices,
      total: totalServices,
      inactive: totalServices - activeServices,
    },
    rating: {
      average: professional.rating || 0,
      totalReviews: professional.reviewCount || 0,
    },
    profile: {
      verified: professional.verified,
      status: professional.status,
      experienceYears: professional.experienceYears ?? 0,
      locations: professional.serviceLocations?.length ?? 0,
      views: professional.profileViews ?? 0,
      since: professional.createdAt.toISOString(),
    },
  };
}

export async function listProfessionalCertifications(userId: string) {
  const professionalId = await getProfessionalIdByUserId(userId);
  if (!professionalId) {
    return null;
  }

  return prisma.professionalCertification.findMany({
    where: { professionalId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProfessionalCertification(
  userId: string,
  payload: unknown
) {
  const professionalId = await getProfessionalIdByUserId(userId);
  if (!professionalId) {
    return null;
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const certificationType = ensureNonEmptyString(body.certificationType, 'Tipo de certificacion');
  const certificationNumber = ensureNonEmptyString(
    body.certificationNumber,
    'Numero de certificacion'
  );
  const issuingOrganization = ensureNonEmptyString(
    body.issuingOrganization,
    'Organizacion emisora'
  );

  return prisma.professionalCertification.create({
    data: {
      professionalId,
      categoryId: normalizeOptionalString(body.categoryId),
      certificationType,
      certificationNumber,
      issuingOrganization,
      issueDate:
        typeof body.issueDate === 'string' && body.issueDate.trim().length > 0
          ? new Date(body.issueDate)
          : null,
      expiryDate:
        typeof body.expiryDate === 'string' && body.expiryDate.trim().length > 0
          ? new Date(body.expiryDate)
          : null,
      documentUrl: normalizeOptionalString(body.documentUrl),
      status: 'pending',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}
