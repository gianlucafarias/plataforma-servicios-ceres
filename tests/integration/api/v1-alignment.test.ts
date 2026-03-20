import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as FORGOT_POST } from '@/app/api/v1/auth/password/forgot/route';
import { POST as RESEND_POST } from '@/app/api/v1/auth/verify/resend/route';
import { POST as SUPPORT_POST } from '@/app/api/v1/support/contact/route';
import { POST as CATEGORY_POST } from '@/app/api/v1/support/category-suggestions/route';
import { GET as PROFESSIONAL_GET } from '@/app/api/v1/professional/[id]/route';

const hoisted = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  createPasswordResetRequestMock: vi.fn(),
  normalizeEmailInputMock: vi.fn(),
  resendVerificationEmailMock: vi.fn(),
  validateSupportContactPayloadMock: vi.fn(),
  createSupportContactSubmissionMock: vi.fn(),
  validateCategorySuggestionPayloadMock: vi.fn(),
  createCategorySuggestionSubmissionMock: vi.fn(),
  getProfessionalProfileContextMock: vi.fn(),
  toProfessionalPublicApiProfileMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: hoisted.getServerSessionMock,
}));

vi.mock('@/lib/server/auth-recovery', () => ({
  PASSWORD_FORGOT_RATE_LIMIT: { limit: 10, windowMs: 600000 },
  VERIFY_RESEND_RATE_LIMIT: { limit: 10, windowMs: 600000 },
  createPasswordResetRequest: hoisted.createPasswordResetRequestMock,
  normalizeEmailInput: hoisted.normalizeEmailInputMock,
  resendVerificationEmail: hoisted.resendVerificationEmailMock,
}));

vi.mock('@/lib/server/support-submissions', () => ({
  SUPPORT_CONTACT_RATE_LIMIT: { limit: 20, windowMs: 600000 },
  CATEGORY_SUGGESTION_RATE_LIMIT: { limit: 20, windowMs: 600000 },
  validateSupportContactPayload: hoisted.validateSupportContactPayloadMock,
  createSupportContactSubmission: hoisted.createSupportContactSubmissionMock,
  validateCategorySuggestionPayload: hoisted.validateCategorySuggestionPayloadMock,
  createCategorySuggestionSubmission: hoisted.createCategorySuggestionSubmissionMock,
}));

vi.mock('@/lib/server/professional-profile', () => ({
  getProfessionalProfileContext: hoisted.getProfessionalProfileContextMock,
  toProfessionalPublicApiProfile: hoisted.toProfessionalPublicApiProfileMock,
}));

function makeJsonRequest(url: string, body: unknown, ip: string) {
  return new NextRequest(
    new Request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-real-ip': ip,
      },
      body: JSON.stringify(body),
    })
  );
}

function makeGetRequest(url: string, ip: string) {
  return new NextRequest(
    new Request(url, {
      headers: {
        'x-real-ip': ip,
      },
    })
  );
}

describe('v1 alignment adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.getServerSessionMock.mockResolvedValue(null);
  });

  it('forgot devuelve fail consistente cuando el email es invalido', async () => {
    hoisted.normalizeEmailInputMock.mockReturnValueOnce(null);

    const res = await FORGOT_POST(
      makeJsonRequest('http://localhost/api/v1/auth/password/forgot', {}, '10.0.0.1')
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('invalid_email');
  });

  it('forgot devuelve ok consistente para solicitudes aceptadas', async () => {
    hoisted.normalizeEmailInputMock.mockReturnValueOnce('ana@example.com');
    hoisted.createPasswordResetRequestMock.mockResolvedValueOnce({ userFound: true });

    const res = await FORGOT_POST(
      makeJsonRequest(
        'http://localhost/api/v1/auth/password/forgot',
        { email: 'ana@example.com' },
        '10.0.0.2'
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.accepted).toBe(true);
    expect(json.meta.requestId).toBeTruthy();
  });

  it('verify/resend conserva estado exitoso si la cuenta ya estaba verificada', async () => {
    hoisted.normalizeEmailInputMock.mockReturnValueOnce('ana@example.com');
    hoisted.resendVerificationEmailMock.mockResolvedValueOnce({ status: 'already_verified' });

    const res = await RESEND_POST(
      makeJsonRequest(
        'http://localhost/api/v1/auth/verify/resend',
        { email: 'ana@example.com' },
        '10.0.0.3'
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.alreadyVerified).toBe(true);
  });

  it('support/contact devuelve ignored sin romper el envelope v1', async () => {
    hoisted.validateSupportContactPayloadMock.mockReturnValueOnce({
      kind: 'ignored',
      message: 'Mensaje recibido.',
    });

    const res = await SUPPORT_POST(
      makeJsonRequest('http://localhost/api/v1/support/contact', { website: 'bot' }, '10.0.0.4')
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.ignored).toBe(true);
  });

  it('support/category-suggestions devuelve validation_error consistente', async () => {
    hoisted.validateCategorySuggestionPayloadMock.mockReturnValueOnce({
      kind: 'error',
      code: 'validation_error',
      message: 'El nombre es obligatorio.',
    });

    const res = await CATEGORY_POST(
      makeJsonRequest('http://localhost/api/v1/support/category-suggestions', {}, '10.0.0.5')
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('validation_error');
  });

  it('professional/[id] devuelve 404 consistente si el perfil no es visible', async () => {
    hoisted.getProfessionalProfileContextMock.mockResolvedValueOnce({ found: false });

    const res = await PROFESSIONAL_GET(makeGetRequest('http://localhost/api/v1/professional/p1', '10.0.0.6'), {
      params: Promise.resolve({ id: 'p1' }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('not_found');
  });

  it('professional/[id] devuelve envelope v1 con data publica', async () => {
    hoisted.getProfessionalProfileContextMock.mockResolvedValueOnce({
      found: true,
      isOwner: false,
      data: { id: 'p1' },
    });
    hoisted.toProfessionalPublicApiProfileMock.mockReturnValueOnce({
      id: 'p1',
      status: 'active',
      bio: 'bio',
      user: { firstName: 'Ana', lastName: 'Perez', verified: true, image: null, location: 'Ceres' },
      services: [],
      certifications: [],
      specialties: [],
      professionalGroup: 'oficios',
      experienceYears: 5,
      verified: true,
      rating: 4.5,
      reviewCount: 3,
      whatsapp: null,
      instagram: null,
      facebook: null,
      linkedin: null,
      website: null,
      portfolio: null,
      ProfilePicture: null,
      location: 'Ceres',
      serviceLocations: [],
      hasPhysicalStore: false,
      physicalStoreAddress: null,
    });

    const res = await PROFESSIONAL_GET(makeGetRequest('http://localhost/api/v1/professional/p1', '10.0.0.7'), {
      params: Promise.resolve({ id: 'p1' }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('p1');
    expect(json.meta.requestId).toBeTruthy();
  });
});
