import { Prisma } from '@prisma/client';

type ProfessionalVisibilityLike = {
  status: string | null | undefined;
  verified: boolean | null | undefined;
  requiresDocumentation?: boolean | null | undefined;
  documentation?: {
    criminalRecordObjectKey?: string | null | undefined;
  } | null;
};

export function getPublicProfessionalWhere(): Prisma.ProfessionalWhereInput {
  return {
    status: 'active',
    verified: true,
    OR: [
      { requiresDocumentation: false },
      {
        AND: [
          { requiresDocumentation: true },
          {
            documentation: {
              is: {
                criminalRecordObjectKey: {
                  not: null,
                },
              },
            },
          },
        ],
      },
    ],
  };
}

export function isProfessionalPubliclyVisible(
  professional: ProfessionalVisibilityLike
): boolean {
  const meetsDocumentationRule =
    professional.requiresDocumentation !== true ||
    !!professional.documentation?.criminalRecordObjectKey;

  return (
    professional.status === 'active' &&
    professional.verified === true &&
    meetsDocumentationRule
  );
}
