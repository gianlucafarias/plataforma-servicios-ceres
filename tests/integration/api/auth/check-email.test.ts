import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/auth/check-email/route'

const hoisted = vi.hoisted(() => ({ prismaMock: { user: { findUnique: vi.fn() }, $disconnect: vi.fn() } }))
vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }))

function makeRequest(url: string, init?: RequestInit) {
  const req = new Request(url, init)
  return new NextRequest(req)
}

describe('check-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET 400 sin email', async () => {
    const res = await GET(makeRequest('http://localhost/api/auth/check-email'))
    expect(res.status).toBe(400)
  })

  it('GET exists=true cuando encuentra usuario', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u1' })
    const res = await GET(makeRequest('http://localhost/api/auth/check-email?email=a@a.com'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.exists).toBe(true)
  })

  it('POST 400 sin email', async () => {
    const res = await POST(makeRequest('http://localhost/api/auth/check-email', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('POST exists=false cuando no encuentra usuario', async () => {
    hoisted.prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const res = await POST(makeRequest('http://localhost/api/auth/check-email', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'b@b.com' }) }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.exists).toBe(false)
  })
})


