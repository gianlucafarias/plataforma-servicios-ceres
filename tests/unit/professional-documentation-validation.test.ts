import { describe, expect, it } from 'vitest';
import {
  PROFESSIONAL_DOCUMENTATION_LIMITS,
  sanitizeProfessionalDocumentation,
  validateProfessionalDocumentation,
} from '@/lib/validation/professional-documentation';

describe('professional documentation validation', () => {
  it('normaliza espacios y caracteres invisibles en referencias', () => {
    const sanitized = sanitizeProfessionalDocumentation({
      laborReferences: [
        {
          name: '  Juan\u200b   Perez  ',
          company: '  Empresa\t SRL ',
          contact: '  3491  440595  ',
        },
      ],
    });

    expect(sanitized.laborReferences?.[0]).toEqual({
      name: 'Juan Perez',
      company: 'Empresa SRL',
      contact: '3491 440595',
      attachment: null,
      id: undefined,
    });
  });

  it('rechaza referencias incompletas', () => {
    const validation = validateProfessionalDocumentation({
      laborReferences: [
        {
          name: 'Juan Perez',
          company: '',
          contact: '3491440595',
        },
      ],
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.laborReferences).toBeTruthy();
    expect(validation.errors.laborReferencesByIndex[0]?.company).toContain('empresa');
  });

  it('rechaza cuando se supera el maximo de referencias', () => {
    const references = Array.from(
      { length: PROFESSIONAL_DOCUMENTATION_LIMITS.maxReferences + 1 },
      (_, index) => ({
        name: `Referencia ${index + 1}`,
        company: `Empresa ${index + 1}`,
        contact: `contacto-${index + 1}@mail.com`,
      })
    );

    const validation = validateProfessionalDocumentation({
      laborReferences: references,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.laborReferences).toContain('hasta');
  });

  it('rechaza campos que exceden el maximo permitido', () => {
    const validation = validateProfessionalDocumentation({
      laborReferences: [
        {
          name: 'A'.repeat(PROFESSIONAL_DOCUMENTATION_LIMITS.referenceNameMaxLength + 1),
          company: 'Empresa valida',
          contact: '3491440595',
        },
      ],
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.laborReferencesByIndex[0]?.name).toContain('no puede superar');
  });
});
