import { describe, it, expect } from 'vitest';
import { cn, generateRandomToken } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('combina clases simples', () => {
      expect(cn('text-red-500', 'bg-blue-200')).toBe('text-red-500 bg-blue-200');
    });

    it('maneja clases condicionales', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('resuelve conflictos de Tailwind correctamente', () => {
      // twMerge debe mantener solo la última clase de padding
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('maneja undefined y null', () => {
      expect(cn('base', undefined, null, 'final')).toBe('base final');
    });
  });

  describe('generateRandomToken', () => {
    it('genera token con longitud por defecto (48)', () => {
      const token = generateRandomToken();
      expect(token).toHaveLength(48);
    });

    it('genera token con longitud personalizada', () => {
      const token = generateRandomToken(24);
      expect(token).toHaveLength(24);
    });

    it('genera tokens únicos', () => {
      const token1 = generateRandomToken();
      const token2 = generateRandomToken();
      expect(token1).not.toBe(token2);
    });

    it('contiene solo caracteres alfanuméricos', () => {
      const token = generateRandomToken(100);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('genera token de longitud 1', () => {
      const token = generateRandomToken(1);
      expect(token).toHaveLength(1);
    });
  });
});

