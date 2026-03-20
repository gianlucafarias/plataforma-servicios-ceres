import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isProfessionalPubliclyVisible } from '@/lib/server/public-professional-visibility';

export type ProfessionalTimeSlot = {
  enabled: boolean;
  start: string;
  end: string;
};

export type ProfessionalDaySchedule = {
  fullDay?: boolean;
  morning?: ProfessionalTimeSlot;
  afternoon?: ProfessionalTimeSlot;
  workOnHolidays?: boolean;
};

export type ProfessionalSchedule = Record<string, ProfessionalDaySchedule>;

const professionalProfileArgs = Prisma.validator<Prisma.ProfessionalDefaultArgs>()({
  select: {
    id: true,
    userId: true,
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
        phone: true,
        verified: true,
        image: true,
        location: true,
      },
    },
    services: {
      where: { available: true },
      orderBy: { createdAt: 'asc' },
      include: {
        category: { select: { name: true, slug: true } },
      },
    },
    certifications: {
      where: { status: 'approved' },
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
    },
  },
});

type ProfessionalProfileRecord = Prisma.ProfessionalGetPayload<typeof professionalProfileArgs>;

export type ProfessionalPageProfile = {
  id: string;
  userId: string;
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
    phone: string | null;
    verified: boolean;
    image: string | null;
    location: string | null;
  };
  services: Array<{
    title: string;
    description: string;
    priceRange: string;
    category: {
      name: string;
      slug: string;
    };
  }>;
  certifications: Array<{
    id: string;
    certificationType: string;
    certificationNumber: string;
    issuingOrganization: string;
    issueDate: string | null;
    expiryDate: string | null;
    documentUrl: string | null;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
};

export type ProfessionalPublicApiProfile = Omit<
  ProfessionalPageProfile,
  'userId' | 'CV' | 'schedule' | 'user'
> & {
  user: Omit<ProfessionalPageProfile['user'], 'phone'>;
};

export type ProfessionalProfileContext =
  | { found: false }
  | {
      found: true;
      isOwner: boolean;
      professional: ProfessionalProfileRecord;
    };

function normalizeSchedule(value: Prisma.JsonValue | null): ProfessionalSchedule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as unknown as ProfessionalSchedule;
}

function serializeProfessional(record: ProfessionalProfileRecord): ProfessionalPageProfile {
  return {
    id: record.id,
    userId: record.userId,
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
      phone: record.user.phone,
      verified: record.user.verified,
      image: record.user.image,
      location: record.user.location,
    },
    services: record.services.map((service) => ({
      title: service.title,
      description: service.description,
      priceRange: service.priceRange,
      category: {
        name: service.category.name,
        slug: service.category.slug,
      },
    })),
    certifications: record.certifications.map((certification) => ({
      id: certification.id,
      certificationType: certification.certificationType,
      certificationNumber: certification.certificationNumber,
      issuingOrganization: certification.issuingOrganization,
      issueDate: certification.issueDate ? certification.issueDate.toISOString() : null,
      expiryDate: certification.expiryDate ? certification.expiryDate.toISOString() : null,
      documentUrl: certification.documentUrl,
      category: certification.category
        ? {
            id: certification.category.id,
            name: certification.category.name,
            slug: certification.category.slug,
          }
        : null,
    })),
  };
}

export async function getProfessionalProfileContext(
  id: string,
  viewerUserId?: string
): Promise<ProfessionalProfileContext> {
  const professional = await prisma.professional.findUnique({
    where: { id },
    ...professionalProfileArgs,
  });

  if (!professional) {
    return { found: false };
  }

  const isOwner = !!viewerUserId && viewerUserId === professional.userId;
  if (!isOwner && !isProfessionalPubliclyVisible(professional)) {
    return { found: false };
  }

  return {
    found: true,
    isOwner,
    professional,
  };
}

export function toProfessionalPageProfile(context: Extract<ProfessionalProfileContext, { found: true }>): ProfessionalPageProfile {
  return serializeProfessional(context.professional);
}

export function toProfessionalPublicApiProfile(
  context: Extract<ProfessionalProfileContext, { found: true }>
): ProfessionalPublicApiProfile {
  const serialized = serializeProfessional(context.professional);
  const { userId: _userId, CV: _cv, schedule: _schedule, user, ...rest } = serialized;

  void _userId;
  void _cv;
  void _schedule;

  return {
    ...rest,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      verified: user.verified,
      image: user.image,
      location: user.location,
    },
  };
}
