import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/v1/auth/register/route';

const hoisted = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    category: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  tx: {
    user: { create: vi.fn() },
    categoryGroup: { upsert: vi.fn() },
    category: { findUnique: vi.fn(), create: vi.fn() },
    professional: { create: vi.fn() },
    verificationToken: { create: vi.fn() },
  },
  enqueueEmailVerifyMock: vi.fn(),
  enqueueSlackAlertMock: vi.fn(),
  safeRecordAuditEventMock: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }));
vi.mock('@/jobs/email.producer', () => ({ enqueueEmailVerify: hoisted.enqueueEmailVerifyMock }));
vi.mock('@/jobs/slack.producer', () => ({ enqueueSlackAlert: hoisted.enqueueSlackAlertMock }));
vi.mock('@/lib/observability/audit', () => ({
  buildChanges: vi.fn(() => ({})),
  safeRecordAuditEvent: hoisted.safeRecordAuditEventMock,
  observedJson: vi.fn(async (_context: unknown, payload: unknown, init?: ResponseInit) =>
    NextResponse.json(payload, init)
  ),
}));

function makeRequest(body: unknown) {
  return new NextRequest(
    new Request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '10.0.0.10',
      },
      body: JSON.stringify(body),
    })
  );
}

const validPayload = {
  email: 'ana@example.com',
  password: 'secret123',
  firstName: 'Ana',
  lastName: 'Perez',
  dni: '12345678',
  birthDate: '1990-01-01',
  location: 'Ceres',
  whatsapp: '349112345678',
  bio: 'Profesional con experiencia en servicios domiciliarios.',
  professionalGroup: 'oficios',
  serviceLocations: ['Ceres'],
  services: [{ categoryId: 'plomero', title: 'Plomeria', description: 'Instalaciones y reparaciones.' }],
};

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('DISABLE_EMAIL_VERIFICATION', 'false');

    hoisted.prismaMock.user.findUnique.mockResolvedValue(null);
    hoisted.prismaMock.category.findMany.mockResolvedValue([{ id: 'cat1', slug: 'plomero' }]);
    hoisted.tx.user.create.mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Perez',
      dni: '12345678',
      verified: false,
      password: 'hashed',
    });
    hoisted.tx.categoryGroup.upsert.mockResolvedValue({ id: 'oficios' });
    hoisted.tx.category.findUnique.mockResolvedValue({ id: 'cat1' });
    hoisted.tx.category.create.mockResolvedValue({
      id: 'cat2',
      name: 'Nueva',
      slug: 'nueva',
      groupId: 'oficios',
      parentCategoryId: null,
      active: true,
    });
    hoisted.tx.professional.create.mockResolvedValue({
      id: 'p1',
      status: 'pending',
      professionalGroup: 'oficios',
    });
    hoisted.tx.verificationToken.create.mockResolvedValue({ id: 'token1' });
    hoisted.prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof hoisted.tx) => Promise<unknown>) =>
      cb(hoisted.tx)
    );
    hoisted.enqueueEmailVerifyMock.mockResolvedValue({ id: 'job1' });
    hoisted.enqueueSlackAlertMock.mockResolvedValue(null);
    hoisted.safeRecordAuditEventMock.mockResolvedValue(undefined);
  });

  it('rechaza email con formato invalido antes de consultar la base', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: 'email-invalido' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('email');
    expect(hoisted.prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza registros de menores de edad', async () => {
    const res = await POST(makeRequest({ ...validPayload, birthDate: '2015-01-01' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('mayor de 18');
    expect(hoisted.prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza un perfil profesional sin WhatsApp valido', async () => {
    const res = await POST(makeRequest({ ...validPayload, whatsapp: '15 123' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('WhatsApp');
    expect(hoisted.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza un grupo profesional invalido y servicios vacios', async () => {
    const res = await POST(
      makeRequest({ ...validPayload, professionalGroup: 'hobbies', services: [] })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('grupo profesional');
    expect(hoisted.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('acepta experienceYears ausente y guarda 0', async () => {
    const { experienceYears: _unused, ...payloadWithoutExperience } = {
      ...validPayload,
      experienceYears: 7,
    };
    void _unused;

    const res = await POST(makeRequest(payloadWithoutExperience));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(hoisted.tx.professional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ experienceYears: 0 }),
      })
    );
  });

  it('rechaza servicios con categorias inexistentes sin crear categorias automaticamente', async () => {
    hoisted.prismaMock.category.findMany.mockResolvedValueOnce([]);

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('categoria');
    expect(hoisted.prismaMock.$transaction).not.toHaveBeenCalled();
    expect(hoisted.tx.category.create).not.toHaveBeenCalled();
  });

  it('no informa que envio correo cuando no pudo encolar la verificacion', async () => {
    hoisted.enqueueEmailVerifyMock.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.message).not.toContain('Te enviamos');
    expect(json.data.emailVerificationQueued).toBe(false);
  });

  it('no informa envio de correo cuando la verificacion esta deshabilitada', async () => {
    vi.stubEnv('DISABLE_EMAIL_VERIFICATION', 'true');

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.message).not.toContain('Te enviamos');
    expect(json.data.emailVerificationDisabled).toBe(true);
    expect(json.data.emailVerificationQueued).toBe(false);
    expect(hoisted.enqueueEmailVerifyMock).not.toHaveBeenCalled();
  });

  it('persiste el genero enviado por registro manual', async () => {
    const res = await POST(makeRequest({ ...validPayload, gender: 'female' }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(hoisted.tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gender: 'female' }),
      })
    );
  });
});
