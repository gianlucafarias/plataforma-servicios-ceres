import { describe, it, expect } from 'vitest';
import { validateUploadServer, detectFileType } from '@/lib/uploadValidator';

describe('uploadValidator', () => {
  describe('validateUploadServer - images', () => {
    it('debe aceptar imagen PNG válida', () => {
      const file = {
        name: 'profile.png',
        type: 'image/png',
        size: 5 * 1024 * 1024, // 5 MB
      };
      const result = validateUploadServer(file, 'image');
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('image');
    });

    it('debe aceptar imagen JPEG válida', () => {
      const file = {
        name: 'profile.jpg',
        type: 'image/jpeg',
        size: 3 * 1024 * 1024,
      };
      const result = validateUploadServer(file, 'image');
      expect(result.valid).toBe(true);
    });

    it('debe rechazar imagen que supera 10MB', () => {
      const file = {
        name: 'large.png',
        type: 'image/png',
        size: 11 * 1024 * 1024, // 11 MB
      };
      const result = validateUploadServer(file, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('supera el tamaño máximo');
    });

    it('debe rechazar tipo de imagen no soportado', () => {
      const file = {
        name: 'image.bmp',
        type: 'image/bmp',
        size: 2 * 1024 * 1024,
      };
      const result = validateUploadServer(file, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no soportado');
    });
  });

  describe('validateUploadServer - CV', () => {
    it('debe aceptar PDF válido', () => {
      const file = {
        name: 'cv.pdf',
        type: 'application/pdf',
        size: 10 * 1024 * 1024, // 10 MB
      };
      const result = validateUploadServer(file, 'cv');
      expect(result.valid).toBe(true);
      expect(result.fileType).toBe('cv');
    });

    it('debe aceptar DOCX válido', () => {
      const file = {
        name: 'cv.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 5 * 1024 * 1024,
      };
      const result = validateUploadServer(file, 'cv');
      expect(result.valid).toBe(true);
    });

    it('debe rechazar CV que supera 15MB', () => {
      const file = {
        name: 'large-cv.pdf',
        type: 'application/pdf',
        size: 16 * 1024 * 1024, // 16 MB
      };
      const result = validateUploadServer(file, 'cv');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('supera el tamaño máximo');
    });

    it('debe rechazar tipo de CV no soportado', () => {
      const file = {
        name: 'cv.txt',
        type: 'text/plain',
        size: 1024,
      };
      const result = validateUploadServer(file, 'cv');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no soportado');
    });

    it('debe aceptar imagen JPG como CV', () => {
      const file = {
        name: 'scan.jpg',
        type: 'image/jpeg',
        size: 5 * 1024 * 1024,
      };
      const result = validateUploadServer(file, 'cv');
      expect(result.valid).toBe(true);
    });
  });

  describe('detectFileType', () => {
    it('debe detectar PDF como CV', () => {
      const file = { name: 'document.pdf', type: 'application/pdf' } as File;
      const type = detectFileType(file);
      expect(type).toBe('cv');
    });

    it('debe detectar PNG como imagen', () => {
      const file = { name: 'photo.png', type: 'image/png' } as File;
      const type = detectFileType(file);
      expect(type).toBe('image');
    });

    it('debe detectar DOCX como CV (prioridad sobre imagen)', () => {
      const file = { name: 'cv.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } as File;
      const type = detectFileType(file);
      expect(type).toBe('cv');
    });

    it('debe retornar null para tipo desconocido', () => {
      const file = { name: 'file.txt', type: 'text/plain' } as File;
      const type = detectFileType(file);
      expect(type).toBe(null);
    });
  });
});

