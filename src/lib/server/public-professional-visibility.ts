import { Prisma } from '@prisma/client';

type ProfessionalVisibilityLike = {
  status: string | null | undefined;
  verified?: boolean | null | undefined;
};

export function getPublicProfessionalWhere(): Prisma.ProfessionalWhereInput {
  return {
    status: 'active',
  };
}

export function isProfessionalPubliclyVisible(
  professional: ProfessionalVisibilityLike
): boolean {
  return professional.status === 'active';
}
