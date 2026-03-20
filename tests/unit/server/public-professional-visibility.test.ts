import { describe, expect, it } from 'vitest';
import {
  getPublicProfessionalWhere,
  isProfessionalPubliclyVisible,
} from '@/lib/server/public-professional-visibility';

describe('public professional visibility', () => {
  it('expone el filtro publico basado en estado activo y verificacion profesional', () => {
    expect(getPublicProfessionalWhere()).toEqual({
      status: 'active',
      verified: true,
    });
  });

  it('considera publico solo un perfil activo y profesionalmente verificado', () => {
    expect(isProfessionalPubliclyVisible({ status: 'active', verified: true })).toBe(true);
    expect(isProfessionalPubliclyVisible({ status: 'active', verified: false })).toBe(false);
    expect(isProfessionalPubliclyVisible({ status: 'pending', verified: true })).toBe(false);
  });
});
