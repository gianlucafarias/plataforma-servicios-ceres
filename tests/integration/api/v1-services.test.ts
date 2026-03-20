import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as SERVICES_GET, POST as SERVICES_POST } from '@/app/api/v1/services/route';
import { GET as SERVICES_STATS_GET } from '@/app/api/v1/services/stats/route';
import {
  PATCH as SERVICE_PATCH,
  DELETE as SERVICE_DELETE,
} from '@/app/api/v1/services/[id]/route';

const hoisted = vi.hoisted(() => {
  class MockServiceFlowError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }

  return {
    getServerSessionMock: vi.fn(),
    listPublicServicesMock: vi.fn(),
    createServiceForUserMock: vi.fn(),
    getServiceCountsMock: vi.fn(),
    updateOwnedServiceMock: vi.fn(),
    deleteOwnedServiceMock: vi.fn(),
    ServiceFlowError: MockServiceFlowError,
  };
});

vi.mock('next-auth', () => ({
  getServerSession: hoisted.getServerSessionMock,
}));

vi.mock('@/lib/server/services', () => ({
  SERVICES_LIST_RATE_LIMIT: { limit: 200, windowMs: 300000 },
  SERVICES_WRITE_RATE_LIMIT: { limit: 40, windowMs: 600000 },
  SERVICES_STATS_RATE_LIMIT: { limit: 120, windowMs: 300000 },
  ServiceFlowError: hoisted.ServiceFlowError,
  listPublicServices: hoisted.listPublicServicesMock,
  createServiceForUser: hoisted.createServiceForUserMock,
  getServiceCounts: hoisted.getServiceCountsMock,
  updateOwnedService: hoisted.updateOwnedServiceMock,
  deleteOwnedService: hoisted.deleteOwnedServiceMock,
}));

function makeGetRequest(url: string, headers?: Record<string, string>) {
  return new NextRequest(
    new Request(url, {
      headers: {
        'x-real-ip': '127.0.0.1',
        ...headers,
      },
    })
  );
}

function makeJsonRequest(url: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  return new NextRequest(
    new Request(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '127.0.0.1',
      },
      body: JSON.stringify(body),
    })
  );
}

describe('v1 services routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getServerSessionMock.mockResolvedValue(null);
  });

  it('services GET devuelve envelope v1 con pagination en meta', async () => {
    hoisted.listPublicServicesMock.mockResolvedValueOnce({
      data: [{ id: 's1', title: 'Servicio' }],
      pagination: { page: 2, limit: 15, total: 31, totalPages: 3 },
    });

    const res = await SERVICES_GET(makeGetRequest('http://localhost/api/v1/services?page=2&limit=15'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data[0].id).toBe('s1');
    expect(json.meta.pagination).toEqual({ page: 2, pageSize: 15, total: 31, totalPages: 3 });
  });

  it('services POST devuelve unauthorized sin sesion', async () => {
    const res = await SERVICES_POST(
      makeJsonRequest('http://localhost/api/v1/services', {
        title: 'Servicio',
        description: 'Desc',
        categorySlug: 'plomero',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('unauthorized');
  });

  it('services POST traduce errores del flujo compartido', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.createServiceForUserMock.mockRejectedValueOnce(
      new hoisted.ServiceFlowError('invalid_body', 'Faltan campos requeridos', 400)
    );

    const res = await SERVICES_POST(
      makeJsonRequest('http://localhost/api/v1/services', {
        title: '',
        description: '',
        categorySlug: '',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('invalid_body');
  });

  it('services stats GET devuelve el mapa de conteos', async () => {
    hoisted.getServiceCountsMock.mockResolvedValueOnce({ plomero: 3, gasista: 1 });

    const res = await SERVICES_STATS_GET(makeGetRequest('http://localhost/api/v1/services/stats'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.plomero).toBe(3);
    expect(res.headers.get('cache-control')).toContain('stale-while-revalidate');
  });

  it('services/[id] PATCH devuelve el recurso actualizado', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.updateOwnedServiceMock.mockResolvedValueOnce({ id: 's1', title: 'Nuevo titulo' });

    const res = await SERVICE_PATCH(
      makeJsonRequest('http://localhost/api/v1/services/s1', { title: 'Nuevo titulo' }, 'PATCH'),
      { params: Promise.resolve({ id: 's1' }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('Nuevo titulo');
  });

  it('services/[id] DELETE devuelve deleted=true', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.deleteOwnedServiceMock.mockResolvedValueOnce(undefined);

    const res = await SERVICE_DELETE(makeGetRequest('http://localhost/api/v1/services/s1'), {
      params: Promise.resolve({ id: 's1' }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deleted).toBe(true);
  });
});
