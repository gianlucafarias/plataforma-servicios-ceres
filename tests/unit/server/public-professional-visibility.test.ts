import { describe, expect, it } from 'vitest';
import {
  getPublicProfessionalWhere,
  isProfessionalPubliclyVisible,
} from '@/lib/server/public-professional-visibility';

describe('public professional visibility', () => {
  it('expone el filtro publico basado solo en estado activo', () => {
    expect(getPublicProfessionalWhere()).toEqual({
      status: 'active',
    });
  });

  it('considera publico cualquier perfil activo, aunque no este verificado', () => {
    expect(isProfessionalPubliclyVisible({ status: 'active', verified: true })).toBe(true);
    expect(isProfessionalPubliclyVisible({ status: 'active', verified: false })).toBe(true);
    expect(isProfessionalPubliclyVisible({ status: 'pending', verified: true })).toBe(false);
    expect(isProfessionalPubliclyVisible({ status: 'suspended', verified: true })).toBe(false);
  });
});
