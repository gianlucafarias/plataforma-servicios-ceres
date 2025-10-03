import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/register/route'

// Mocks seguros para hoisting usando vi.hoisted
const hoisted = vi.hoisted(() => {
  return {
    prismaMock: {
      user: { findUnique: vi.fn() },
      $transaction: vi.fn(),
    },
  }
})
vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }))
vi.mock('@/lib/mail', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }))

function makeRequest(body: unknown) {
  const url = 'http://localhost/api/auth/register'
  const req = new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  return new NextRequest(req)
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
    // reinicializar funciones mockeadas
    hoisted.prismaMock.user.findUnique = vi.fn()
    hoisted.prismaMock.$transaction = vi.fn()
  })

  it('retorna 400 si faltan datos requeridos', async () => {
    const req = makeRequest({ email: 'a@a.com' })
    // ejecuta
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toContain('Faltan datos')
  })

  it('retorna 400 si el usuario ya existe', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'dup@acme.com' })

    const req = makeRequest({
      email: 'dup@acme.com',
      password: 'example-password',
      firstName: 'John',
      lastName: 'Doe'
    })

    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toBe('El usuario ya existe')
  })

  it('crea usuario y devuelve 200 con devVerifyUrl en entorno no producción', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce(null)

    hoisted.prismaMock.$transaction.mockImplementationOnce(
      async (
        cb: (tx: {
          user: { create: (...a: unknown[]) => Promise<unknown> };
          categoryGroup: { upsert: (...a: unknown[]) => Promise<{ id: string }> };
          category: {
            findUnique: (...a: unknown[]) => Promise<unknown>;
            create: (...a: unknown[]) => Promise<unknown>;
          };
          professional: { create: (...a: unknown[]) => Promise<unknown> };
          verificationToken: { create: (...a: unknown[]) => Promise<unknown> };
        }) => Promise<unknown>
      ) => {
        const tx = {
          user: { create: vi.fn().mockResolvedValue({ id: 'u1', email: 'ok@acme.com', firstName: 'Jane', lastName: 'Doe', password: 'hashed' }) },
          categoryGroup: { upsert: vi.fn().mockResolvedValue({ id: 'oficios' }) },
          category: { findUnique: vi.fn(), create: vi.fn() },
          professional: { create: vi.fn() },
          verificationToken: { create: vi.fn() },
        } as Parameters<typeof cb>[0];
    
        const result = await cb(tx);
        return result;
      }
    );

    const req = makeRequest({
      email: 'ok@acme.com',
      password: 'example-password-123',
      firstName: 'Jane',
      lastName: 'Doe',
      professionalGroup: 'oficios'
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toContain('Usuario registrado')
    expect(json.user.email).toBe('ok@acme.com')
    expect(json).toHaveProperty('devVerifyUrl')
  })
})


