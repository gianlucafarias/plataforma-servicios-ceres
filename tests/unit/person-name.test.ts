import { describe, expect, it } from 'vitest';
import { buildPersonFullName, normalizePersonNamePart } from '@/lib/person-name';

describe('person name formatting', () => {
  it('normalizes a single name part', () => {
    expect(normalizePersonNamePart('juan')).toBe('Juan');
    expect(normalizePersonNamePart('  mArIa  ')).toBe('Maria');
  });

  it('normalizes each word in a name part', () => {
    expect(normalizePersonNamePart('de la cruz')).toBe('De La Cruz');
    expect(normalizePersonNamePart('maría-josé')).toBe('María-José');
  });

  it('builds a normalized full name', () => {
    expect(buildPersonFullName('ana', 'perez')).toBe('Ana Perez');
  });
});
