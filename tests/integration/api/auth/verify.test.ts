import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/verify/route'

const hoisted = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    verificationToken: { findFirst: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  }
}))
vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }))

function makeRequest(body: unknown) {
  const req = new Request('http://localhost/api/auth/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return new NextRequest(req)
}

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('400 si faltan datos', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('404 si no existe el usuario', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ token: 't', email: 'x@x.com' }))
    expect(res.status).toBe(404)
  })

  it('400 si token inválido', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' })
    hoisted.prismaMock.verificationToken.findFirst.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ token: 'bad', email: 'x@x.com' }))
    expect(res.status).toBe(400)
  })

  it('400 si token expirado (se borra token)', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' })
    hoisted.prismaMock.verificationToken.findFirst.mockResolvedValueOnce({ id: 't1', expiresAt: new Date(Date.now() - 1000), token: 't', userId: 'u1' })
    const res = await POST(makeRequest({ token: 't', email: 'x@x.com' }))
    expect(hoisted.prismaMock.verificationToken.delete).toHaveBeenCalled()
    expect(res.status).toBe(400)
  })

  it('200 marca verificado y elimina token', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' })
    hoisted.prismaMock.verificationToken.findFirst.mockResolvedValueOnce({ id: 't1', expiresAt: new Date(Date.now() + 1000 * 60), token: 't', userId: 'u1' })
    hoisted.prismaMock.$transaction.mockImplementationOnce(
      async (
        cb: (tx: {
          user: { update: (...a: unknown[]) => Promise<unknown> }
          verificationToken: { delete: (...a: unknown[]) => Promise<unknown> }
        }) => Promise<unknown>
      ) => {
        const tx = {
          user: hoisted.prismaMock.user,
          verificationToken: hoisted.prismaMock.verificationToken,
        } as Parameters<typeof cb>[0]
        return cb(tx)
      }
    )
    const res = await POST(makeRequest({ token: 't', email: 'x@x.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain('Cuenta verificada')
  })
})


