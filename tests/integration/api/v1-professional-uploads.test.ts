import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as CHECK_EMAIL_GET } from '@/app/api/v1/auth/check-email/route';
import { POST as UPLOAD_GRANT_POST } from '@/app/api/v1/upload/grant/route';
import { POST as UPLOAD_POST } from '@/app/api/v1/upload/route';
import { POST as UPLOAD_EXTERNAL_POST } from '@/app/api/v1/upload/external/route';
import { GET as PROFESSIONAL_ME_GET, PUT as PROFESSIONAL_ME_PUT } from '@/app/api/v1/professional/me/route';
import { PUT as PROFESSIONAL_SCHEDULE_PUT } from '@/app/api/v1/professional/schedule/route';
import { GET as PROFESSIONAL_STATS_GET } from '@/app/api/v1/professional/stats/route';
import {
  GET as PROFESSIONAL_CERTIFICATIONS_GET,
  POST as PROFESSIONAL_CERTIFICATIONS_POST,
} from '@/app/api/v1/professional/certifications/route';

const hoisted = vi.hoisted(() => {
  class MockUploadFlowError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }

  class MockProfessionalDashboardError extends Error {
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
    normalizeLookupEmailMock: vi.fn(),
    checkEmailExistsMock: vi.fn(),
    createRegisterUploadGrantFromPayloadMock: vi.fn(),
    processProfileUploadMock: vi.fn(),
    processExternalOAuthUploadMock: vi.fn(),
    getProfessionalDashboardProfileMock: vi.fn(),
    updateProfessionalDashboardProfileMock: vi.fn(),
    getProfessionalStatsMock: vi.fn(),
    listProfessionalCertificationsMock: vi.fn(),
    createProfessionalCertificationMock: vi.fn(),
    UploadFlowError: MockUploadFlowError,
    ProfessionalDashboardError: MockProfessionalDashboardError,
  };
});

vi.mock('next-auth', () => ({
  getServerSession: hoisted.getServerSessionMock,
}));

vi.mock('@/lib/server/check-email', () => ({
  CHECK_EMAIL_RATE_LIMIT: { limit: 60, windowMs: 600000 },
  normalizeLookupEmail: hoisted.normalizeLookupEmailMock,
  checkEmailExists: hoisted.checkEmailExistsMock,
}));

vi.mock('@/lib/server/uploads', () => ({
  UPLOAD_RATE_LIMIT: { limit: 30, windowMs: 600000 },
  UPLOAD_EXTERNAL_RATE_LIMIT: { limit: 20, windowMs: 600000 },
  UPLOAD_GRANT_RATE_LIMIT: { limit: 20, windowMs: 600000 },
  UploadFlowError: hoisted.UploadFlowError,
  createRegisterUploadGrantFromPayload: hoisted.createRegisterUploadGrantFromPayloadMock,
  processProfileUpload: hoisted.processProfileUploadMock,
  processExternalOAuthUpload: hoisted.processExternalOAuthUploadMock,
}));

vi.mock('@/lib/server/professional-dashboard', () => ({
  ProfessionalDashboardError: hoisted.ProfessionalDashboardError,
  getProfessionalDashboardProfile: hoisted.getProfessionalDashboardProfileMock,
  updateProfessionalDashboardProfile: hoisted.updateProfessionalDashboardProfileMock,
  getProfessionalStats: hoisted.getProfessionalStatsMock,
  listProfessionalCertifications: hoisted.listProfessionalCertificationsMock,
  createProfessionalCertification: hoisted.createProfessionalCertificationMock,
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

function makeJsonRequest(url: string, body: unknown, method: 'POST' | 'PUT' = 'POST') {
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

function makeFormRequest(url: string, formData: FormData) {
  const request = new NextRequest(url, {
    method: 'POST',
    headers: {
      'x-real-ip': '127.0.0.1',
    },
  });

  Object.defineProperty(request, 'formData', {
    value: vi.fn().mockResolvedValue(formData),
  });

  return request;
}

describe('v1 uploads and professional adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getServerSessionMock.mockResolvedValue(null);
  });

  it('check-email devuelve ok con exists', async () => {
    hoisted.normalizeLookupEmailMock.mockReturnValueOnce('ana@example.com');
    hoisted.checkEmailExistsMock.mockResolvedValueOnce(true);

    const res = await CHECK_EMAIL_GET(
      makeGetRequest('http://localhost/api/v1/auth/check-email?email=ana@example.com')
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.exists).toBe(true);
    expect(json.meta.requestId).toBeTruthy();
  });

  it('upload/grant devuelve ok con token', async () => {
    hoisted.createRegisterUploadGrantFromPayloadMock.mockReturnValueOnce({
      token: 'grant-token',
      expiresAt: '2026-03-16T12:05:00.000Z',
    });

    const res = await UPLOAD_GRANT_POST(
      makeJsonRequest('http://localhost/api/v1/upload/grant', {
        context: 'register',
        type: 'image',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.token).toBe('grant-token');
  });

  it('upload devuelve fail si el flujo compartido rechaza la solicitud', async () => {
    const formData = new FormData();
    formData.append('file', new File(['hello'], 'avatar.jpg', { type: 'image/jpeg' }));
    hoisted.processProfileUploadMock.mockRejectedValueOnce(
      new hoisted.UploadFlowError('unauthorized', 'No autorizado', 401)
    );

    const res = await UPLOAD_POST(makeFormRequest('http://localhost/api/v1/upload', formData));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('unauthorized');
  });

  it('upload/external devuelve ok con la URL guardada', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.processExternalOAuthUploadMock.mockResolvedValueOnce({
      url: 'https://static.example.com/profiles/1.jpg',
      value: 'https://static.example.com/profiles/1.jpg',
    });

    const res = await UPLOAD_EXTERNAL_POST(
      makeJsonRequest('http://localhost/api/v1/upload/external', {
        imageUrl: 'https://lh3.googleusercontent.com/avatar.jpg',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.url).toContain('static.example.com');
  });

  it('professional/me GET devuelve unauthorized sin sesion', async () => {
    const res = await PROFESSIONAL_ME_GET(makeGetRequest('http://localhost/api/v1/professional/me'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('unauthorized');
  });

  it('professional/me GET devuelve el perfil endurecido', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.getProfessionalDashboardProfileMock.mockResolvedValueOnce({
      id: 'p1',
      status: 'active',
      bio: 'bio',
      experienceYears: 5,
      verified: true,
      rating: 4.5,
      reviewCount: 3,
      specialties: ['electricidad'],
      professionalGroup: 'oficios',
      whatsapp: null,
      instagram: null,
      facebook: null,
      linkedin: null,
      website: null,
      portfolio: null,
      CV: null,
      ProfilePicture: null,
      location: 'Ceres',
      serviceLocations: [],
      hasPhysicalStore: false,
      physicalStoreAddress: null,
      schedule: null,
      user: {
        firstName: 'Ana',
        lastName: 'Perez',
        email: 'ana@example.com',
        phone: null,
        verified: true,
        birthDate: null,
        location: 'Ceres',
      },
      services: [],
      registrationType: 'email',
    });

    const res = await PROFESSIONAL_ME_GET(makeGetRequest('http://localhost/api/v1/professional/me'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('p1');
    expect(json.data.registrationType).toBe('email');
  });

  it('professional/me PUT traduce validation_error del servicio compartido', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.updateProfessionalDashboardProfileMock.mockRejectedValueOnce(
      new hoisted.ProfessionalDashboardError('validation_error', 'Nombre es obligatorio', 400)
    );

    const res = await PROFESSIONAL_ME_PUT(
      makeJsonRequest('http://localhost/api/v1/professional/me', { firstName: '' }, 'PUT')
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
  });

  it('professional/schedule PUT devuelve el perfil actualizado', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.updateProfessionalDashboardProfileMock.mockResolvedValueOnce({
      id: 'p1',
    });

    const res = await PROFESSIONAL_SCHEDULE_PUT(
      makeJsonRequest(
        'http://localhost/api/v1/professional/schedule',
        { schedule: { monday: { fullDay: true } } },
        'PUT'
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.message).toContain('Horarios');
  });

  it('professional/stats GET devuelve estadisticas', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.getProfessionalStatsMock.mockResolvedValueOnce({
      services: { active: 2, total: 3, inactive: 1 },
      rating: { average: 4.8, totalReviews: 10 },
      profile: {
        verified: true,
        status: 'active',
        experienceYears: 8,
        locations: 2,
        views: 25,
        since: '2026-03-01T00:00:00.000Z',
      },
    });

    const res = await PROFESSIONAL_STATS_GET(makeGetRequest('http://localhost/api/v1/professional/stats'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.services.active).toBe(2);
  });

  it('professional/certifications GET devuelve lista', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.listProfessionalCertificationsMock.mockResolvedValueOnce([
      {
        id: 'c1',
        certificationType: 'matricula',
      },
    ]);

    const res = await PROFESSIONAL_CERTIFICATIONS_GET(
      makeGetRequest('http://localhost/api/v1/professional/certifications')
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it('professional/certifications POST devuelve 201 con certificacion creada', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    hoisted.createProfessionalCertificationMock.mockResolvedValueOnce({
      id: 'c1',
      certificationType: 'matricula',
    });

    const res = await PROFESSIONAL_CERTIFICATIONS_POST(
      makeJsonRequest('http://localhost/api/v1/professional/certifications', {
        certificationType: 'matricula',
        certificationNumber: '123',
        issuingOrganization: 'Colegio',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.certification.id).toBe('c1');
  });
});
