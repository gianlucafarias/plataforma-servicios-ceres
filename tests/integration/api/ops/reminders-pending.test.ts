import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/ops/reminders/pending/route';

const hoisted = vi.hoisted(() => ({
  prismaMock: {
    user: { findMany: vi.fn() },
    professional: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }));

function makeRequest(query: string, apiKey?: string) {
  const headers: HeadersInit = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return new NextRequest(
    new Request(`http://localhost/api/v1/ops/reminders/pending${query}`, {
      method: 'GET',
      headers,
    }),
  );
}

describe('GET /api/v1/ops/reminders/pending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('OPS_API_KEY', 'ops-key');
    vi.stubEnv('ADMIN_API_KEY', 'admin-key');
  });

  it('requiere api key', async () => {
    const res = await GET(makeRequest('?type=verify_account&window=d1'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('unauthorized');
  });

  it('valida parametro type', async () => {
    const res = await GET(makeRequest('?type=otro&window=d1', 'ops-key'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
  });

  it('devuelve pendientes de verificacion de cuenta', async () => {
    hoisted.prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 'u1',
        email: 'ana@example.com',
        firstName: 'Ana',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const res = await GET(
      makeRequest('?type=verify_account&window=d1&limit=10', 'ops-key'),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({
      entityType: 'user',
      entityId: 'u1',
      templateKey: 'services.reminder_verify_account',
      idempotencyKey: 'reminder.verify_email:u1:d1',
      source: 'plataforma-servicios-ceres',
      domain: 'auth.email',
    });
    expect(json.pagination.limit).toBe(10);
  });

  it('devuelve pendientes de certificado penal', async () => {
    hoisted.prismaMock.professional.findMany.mockResolvedValueOnce([
      {
        id: 'p1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        user: {
          email: 'prof@example.com',
          firstName: 'Pro',
        },
      },
    ]);

    const res = await GET(
      makeRequest('?type=missing_criminal_record&window=d3', 'admin-key'),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({
      entityType: 'professional',
      entityId: 'p1',
      templateKey: 'services.reminder_missing_criminal_record',
      idempotencyKey: 'reminder.criminal_record:p1:d3',
      source: 'plataforma-servicios-ceres',
      domain: 'professional.documentation',
    });
  });
});

