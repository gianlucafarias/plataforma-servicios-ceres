import type { LaborReference, ProfessionalDocumentation } from '@/types';

export const PROFESSIONAL_DOCUMENTATION_LIMITS = {
  maxReferences: 5,
  referenceNameMaxLength: 80,
  referenceCompanyMaxLength: 120,
  referenceContactMaxLength: 120,
} as const;

const INVISIBLE_OR_CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g;
const MULTIPLE_SPACES = /\s+/g;

export type ProfessionalDocumentationFieldErrors = {
  criminalRecord?: string;
  laborReferences?: string;
  laborReferencesByIndex: Array<{
    name?: string;
    company?: string;
    contact?: string;
  }>;
};

function normalizeSingleLine(value: string) {
  return value.replace(INVISIBLE_OR_CONTROL_CHARS, ' ').replace(MULTIPLE_SPACES, ' ').trim();
}

function normalizeReference(reference: LaborReference): LaborReference {
  return {
    id: reference.id,
    name: normalizeSingleLine(reference.name ?? ''),
    company: normalizeSingleLine(reference.company ?? ''),
    contact: normalizeSingleLine(reference.contact ?? ''),
    attachment: reference.attachment ?? null,
  };
}

function hasAnyReferenceValue(reference: LaborReference) {
  return (
    reference.name.length > 0 ||
    reference.company.length > 0 ||
    reference.contact.length > 0 ||
    !!reference.attachment
  );
}

function validateReferenceLength(
  value: string,
  label: string,
  maxLength: number
) {
  if (value.length > maxLength) {
    return `${label} no puede superar ${maxLength} caracteres.`;
  }

  return undefined;
}

export function sanitizeProfessionalDocumentation(
  value: ProfessionalDocumentation | undefined
): ProfessionalDocumentation {
  const laborReferences = (value?.laborReferences ?? []).map(normalizeReference);

  return {
    ...value,
    criminalRecord: value?.criminalRecord ?? null,
    laborReferences,
  };
}

export function validateProfessionalDocumentation(
  value: ProfessionalDocumentation | undefined
): {
  sanitized: ProfessionalDocumentation;
  errors: ProfessionalDocumentationFieldErrors;
  isValid: boolean;
} {
  const sanitized = sanitizeProfessionalDocumentation(value);
  const laborReferences = sanitized.laborReferences ?? [];
  const errors: ProfessionalDocumentationFieldErrors = {
    laborReferencesByIndex: laborReferences.map(() => ({})),
  };

  if (laborReferences.length > PROFESSIONAL_DOCUMENTATION_LIMITS.maxReferences) {
    errors.laborReferences = `Puedes cargar hasta ${PROFESSIONAL_DOCUMENTATION_LIMITS.maxReferences} referencias laborales.`;
  }

  laborReferences.forEach((reference, index) => {
    const fieldErrors = errors.laborReferencesByIndex[index];
    const hasAnyValue = hasAnyReferenceValue(reference);

    if (!hasAnyValue) {
      return;
    }

    if (!reference.name) {
      fieldErrors.name = 'Ingresa el nombre del referente.';
    } else {
      fieldErrors.name = validateReferenceLength(
        reference.name,
        'El nombre del referente',
        PROFESSIONAL_DOCUMENTATION_LIMITS.referenceNameMaxLength
      );
    }

    if (!reference.company) {
      fieldErrors.company = 'Ingresa la empresa o institucion.';
    } else {
      fieldErrors.company = validateReferenceLength(
        reference.company,
        'La empresa o institucion',
        PROFESSIONAL_DOCUMENTATION_LIMITS.referenceCompanyMaxLength
      );
    }

    if (!reference.contact) {
      fieldErrors.contact = 'Ingresa un dato de contacto.';
    } else {
      fieldErrors.contact = validateReferenceLength(
        reference.contact,
        'El contacto',
        PROFESSIONAL_DOCUMENTATION_LIMITS.referenceContactMaxLength
      );
    }
  });

  const hasReferenceFieldErrors = errors.laborReferencesByIndex.some((referenceErrors) =>
    Object.values(referenceErrors).some(Boolean)
  );

  if (!errors.laborReferences && hasReferenceFieldErrors) {
    errors.laborReferences = 'Revisa los datos de las referencias laborales.';
  }

  const isValid =
    !errors.criminalRecord &&
    !errors.laborReferences &&
    !hasReferenceFieldErrors;

  return {
    sanitized,
    errors,
    isValid,
  };
}

export function sanitizeDocumentationReferenceField(value: string) {
  return normalizeSingleLine(value);
}
