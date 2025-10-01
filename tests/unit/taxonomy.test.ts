import { describe, it, expect } from 'vitest';
import {
  getAreasByGroup,
  getSubcategories,
  getLocations,
  getGenders,
  AREAS_OFICIOS,
  SUBCATEGORIES_OFICIOS,
  SUBCATEGORIES_PROFESIONES,
  LOCATIONS,
  GENDERS
} from '@/lib/taxonomy';

describe('taxonomy', () => {
  describe('getAreasByGroup', () => {
    it('retorna áreas cuando el grupo es "oficios"', () => {
      const areas = getAreasByGroup('oficios');
      expect(areas).toEqual(AREAS_OFICIOS);
      expect(areas.length).toBeGreaterThan(0);
    });

    it('retorna array vacío cuando el grupo es "profesiones"', () => {
      const areas = getAreasByGroup('profesiones');
      expect(areas).toEqual([]);
    });

    it('todas las áreas tienen las propiedades requeridas', () => {
      const areas = getAreasByGroup('oficios');
      areas.forEach(area => {
        expect(area).toHaveProperty('id');
        expect(area).toHaveProperty('name');
        expect(area).toHaveProperty('slug');
        expect(area).toHaveProperty('group');
        expect(area.group).toBe('oficios');
      });
    });
  });

  describe('getSubcategories', () => {
    it('retorna todas las subcategorías de oficios sin filtro', () => {
      const subcats = getSubcategories('oficios');
      expect(subcats).toEqual(SUBCATEGORIES_OFICIOS);
    });

    it('filtra subcategorías de oficios por área específica', () => {
      const subcats = getSubcategories('oficios', 'construccion-mantenimiento');
      expect(subcats.length).toBeGreaterThan(0);
      subcats.forEach(sub => {
        expect(sub.areaSlug).toBe('construccion-mantenimiento');
      });
    });

    it('retorna profesiones sin filtrar por área', () => {
      const subcats = getSubcategories('profesiones');
      expect(subcats).toEqual(SUBCATEGORIES_PROFESIONES);
    });

    it('ignora filtro de área para profesiones', () => {
      const subcatsWithFilter = getSubcategories('profesiones', 'alguna-area');
      const subcatsWithoutFilter = getSubcategories('profesiones');
      expect(subcatsWithFilter).toEqual(subcatsWithoutFilter);
    });

    it('retorna array vacío si el área no existe en oficios', () => {
      const subcats = getSubcategories('oficios', 'area-inexistente');
      expect(subcats).toEqual([]);
    });

    it('todas las subcategorías tienen propiedades requeridas', () => {
      const subcats = getSubcategories('oficios');
      subcats.forEach(sub => {
        expect(sub).toHaveProperty('id');
        expect(sub).toHaveProperty('name');
        expect(sub).toHaveProperty('slug');
        expect(sub).toHaveProperty('group');
      });
    });
  });

  describe('getLocations', () => {
    it('retorna todas las locaciones', () => {
      const locations = getLocations();
      expect(locations).toEqual(LOCATIONS);
      expect(locations.length).toBeGreaterThan(0);
    });

    it('incluye Ceres como primera locación', () => {
      const locations = getLocations();
      expect(locations[0].id).toBe('ceres');
      expect(locations[0].name).toContain('Ceres');
    });

    it('todas las locaciones tienen id y name', () => {
      const locations = getLocations();
      locations.forEach(loc => {
        expect(loc).toHaveProperty('id');
        expect(loc).toHaveProperty('name');
        expect(typeof loc.id).toBe('string');
        expect(typeof loc.name).toBe('string');
      });
    });
  });

  describe('getGenders', () => {
    it('retorna todos los géneros', () => {
      const genders = getGenders();
      expect(genders).toEqual(GENDERS);
      expect(genders).toHaveLength(3);
    });

    it('incluye los tres géneros esperados', () => {
      const genders = getGenders();
      const ids = genders.map(g => g.id);
      expect(ids).toContain('male');
      expect(ids).toContain('female');
      expect(ids).toContain('other');
    });

    it('cada género tiene id y name', () => {
      const genders = getGenders();
      genders.forEach(gender => {
        expect(gender).toHaveProperty('id');
        expect(gender).toHaveProperty('name');
        expect(typeof gender.id).toBe('string');
        expect(typeof gender.name).toBe('string');
      });
    });
  });
});

