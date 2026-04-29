import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as GET_LIST } from '@/app/api/professionals/route';
import { GET as GET_DETAIL } from '@/app/api/professional/[id]/route';

const hoisted = vi.hoisted(() => ({
  prismaMock: {
    professional: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  getServerSessionMock: vi.fn(),
  getProfessionalProfileContextMock: vi.fn(),
  toProfessionalPublicApiProfileMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }));
vi.mock('next-auth', () => ({ getServerSession: hoisted.getServerSessionMock }));
vi.mock('@/lib/server/professional-profile', () => ({
  getProfessionalProfileContext: hoisted.getProfessionalProfileContextMock,
  toProfessionalPublicApiProfile: hoisted.toProfessionalPublicApiProfileMock,
}));

function makeRequest(url: string) {
  return new NextRequest(new Request(url));
}

describe('GET /api/professionals', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista con paginacion y mapeo de verificacion profesional', async () => {
    hoisted.prismaMock.professional.count.mockResolvedValueOnce(2);
    hoisted.prismaMock.professional.findMany.mockResolvedValueOnce([
      {
        id: 'p1',
        bio: 'bio1',
        verified: true,
        location: 'ceres',
        rating: 4.2,
        reviewCount: 5,
        ProfilePicture: null,
        user: { firstName: 'Ana', lastName: 'Garcia', verified: false },
        services: [{ category: { name: 'Plomeria' } }],
      },
      {
        id: 'p2',
        bio: 'bio2',
        verified: false,
        location: 'hersilia',
        rating: 0,
        reviewCount: 0,
        ProfilePicture: null,
        user: { firstName: 'Juan', lastName: 'Perez', verified: true },
        services: [],
      },
    ]);

    const res = await GET_LIST(
      makeRequest(
        'http://localhost/api/professionals?limit=10&page=1&grupo=oficios&categoria=plomero&location=ceres&sortBy=recent'
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.pagination.total).toBe(2);
    expect(json.data[0]).toMatchObject({
      id: 'p1',
      user: { name: 'Ana Garcia' },
      primaryCategory: { name: 'Plomeria' },
      verified: true,
    });
    expect(json.data[1].verified).toBe(false);
    expect(hoisted.prismaMock.professional.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: 'active',
        professionalGroup: 'oficios',
      }),
    });
    expect(hoisted.prismaMock.professional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
          professionalGroup: 'oficios',
        }),
      })
    );
  });
});

describe('GET /api/professional/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getServerSessionMock.mockResolvedValue(null);
    hoisted.toProfessionalPublicApiProfileMock.mockImplementation((value) => value.data);
  });

  it('404 cuando no existe', async () => {
    hoisted.getProfessionalProfileContextMock.mockResolvedValueOnce({ found: false });

    const mockParams = Promise.resolve({ id: 'xxx' });
    const res = await GET_DETAIL(makeRequest('http://localhost/api/professional/xxx'), {
      params: mockParams,
    });

    expect(res.status).toBe(404);
  });

  it('200 devuelve profesional', async () => {
    hoisted.getProfessionalProfileContextMock.mockResolvedValueOnce({
      found: true,
      isOwner: false,
      data: {
        id: 'p1',
        status: 'active',
      },
    });

    const mockParams = Promise.resolve({ id: 'p1' });
    const res = await GET_DETAIL(makeRequest('http://localhost/api/professional/p1'), {
      params: mockParams,
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('p1');
  });

  it('404 cuando el perfil no esta disponible para el publico', async () => {
    hoisted.getProfessionalProfileContextMock.mockResolvedValueOnce({ found: false });

    const mockParams = Promise.resolve({ id: 'p1' });
    const res = await GET_DETAIL(makeRequest('http://localhost/api/professional/p1'), {
      params: mockParams,
    });

    expect(res.status).toBe(404);
  });

  it('200 devuelve perfil pendiente al dueno autenticado', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.getProfessionalProfileContextMock.mockResolvedValueOnce({
      found: true,
      isOwner: true,
      data: {
        id: 'p1',
        status: 'pending',
      },
    });

    const mockParams = Promise.resolve({ id: 'p1' });
    const res = await GET_DETAIL(makeRequest('http://localhost/api/professional/p1'), {
      params: mockParams,
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('pending');
  });
});
