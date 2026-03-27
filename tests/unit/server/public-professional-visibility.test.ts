import { describe, expect, it } from 'vitest';
import {
  getPublicProfessionalWhere,
  isProfessionalPubliclyVisible,
} from '@/lib/server/public-professional-visibility';

describe('public professional visibility', () => {
  it('expone el filtro publico basado en estado activo, verificacion y documentacion requerida', () => {
    expect(getPublicProfessionalWhere()).toEqual({
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
    });
  });

  it('considera publico solo un perfil activo, profesionalmente verificado y con documentacion obligatoria completa cuando aplica', () => {
    expect(isProfessionalPubliclyVisible({ status: 'active', verified: true })).toBe(true);
    expect(
      isProfessionalPubliclyVisible({
        status: 'active',
        verified: true,
        requiresDocumentation: true,
        documentation: { criminalRecordObjectKey: 'private/doc.pdf' },
      })
    ).toBe(true);
    expect(
      isProfessionalPubliclyVisible({
        status: 'active',
        verified: true,
        requiresDocumentation: true,
        documentation: { criminalRecordObjectKey: null },
      })
    ).toBe(false);
    expect(isProfessionalPubliclyVisible({ status: 'active', verified: false })).toBe(false);
    expect(isProfessionalPubliclyVisible({ status: 'pending', verified: true })).toBe(false);
  });
});
