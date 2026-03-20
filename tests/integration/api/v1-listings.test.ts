import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as CATEGORIES_GET } from '@/app/api/v1/categories/route';
import { GET as PROFESSIONALS_GET } from '@/app/api/v1/professionals/route';

const hoisted = vi.hoisted(() => ({
  getPublicCategoryTreeMock: vi.fn(),
  listPublicProfessionalsMock: vi.fn(),
}));

vi.mock('@/lib/server/categories', () => ({
  CATEGORIES_LIST_RATE_LIMIT: { limit: 60, windowMs: 300000 },
  getPublicCategoryTree: hoisted.getPublicCategoryTreeMock,
}));

vi.mock('@/lib/server/public-professionals', () => ({
  PROFESSIONALS_LIST_RATE_LIMIT: { limit: 120, windowMs: 300000 },
  listPublicProfessionals: hoisted.listPublicProfessionalsMock,
}));

function makeGetRequest(url: string) {
  return new NextRequest(
    new Request(url, {
      headers: {
        'x-real-ip': '127.0.0.1',
      },
    })
  );
}

describe('v1 public listings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('categories devuelve el arbol publico con envelope v1', async () => {
    hoisted.getPublicCategoryTreeMock.mockResolvedValueOnce({
      areas: [{ id: 'a1', slug: 'hogar' }],
      subcategoriesOficios: [],
      subcategoriesProfesiones: [],
    });

    const res = await CATEGORIES_GET(makeGetRequest('http://localhost/api/v1/categories'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.areas[0].id).toBe('a1');
    expect(json.meta.requestId).toBeTruthy();
  });

  it('professionals devuelve meta paginada con totalPages', async () => {
    hoisted.listPublicProfessionalsMock.mockResolvedValueOnce({
      data: [{ id: 'p1', user: { name: 'Ana Perez' } }],
      pagination: {
        page: 1,
        pageSize: 12,
        total: 23,
        totalPages: 2,
      },
    });

    const res = await PROFESSIONALS_GET(makeGetRequest('http://localhost/api/v1/professionals?page=1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data[0].id).toBe('p1');
    expect(json.meta.pagination).toEqual({
      page: 1,
      pageSize: 12,
      total: 23,
      totalPages: 2,
    });
  });
});
