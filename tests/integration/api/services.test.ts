import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/services/route'

// Hoisted mocks para Prisma y next-auth
const hoisted = vi.hoisted(() => {
  return {
    prismaMock: {
      service: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() },
      professional: { findUnique: vi.fn() },
      category: { findUnique: vi.fn(), create: vi.fn() },
    },
    getServerSessionMock: vi.fn(),
  }
})

vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }))
vi.mock('next-auth', async (orig) => {
  return {
    ...(await orig()),
    getServerSession: hoisted.getServerSessionMock,
  }
})
vi.mock('@/app/api/auth/options', () => ({ authOptions: {} }))

function makeRequest(url: string, init?: RequestInit) {
  const req = new Request(url, init)
  return new NextRequest(req)
}

describe('GET /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna lista, totales y paginación', async () => {
    hoisted.prismaMock.service.count.mockResolvedValueOnce(2)
    hoisted.prismaMock.service.findMany.mockResolvedValueOnce([
      {
        id: 's1', title: 'T1', description: 'D1', priceRange: '$',
        category: { name: 'Cat 1' },
        professional: {
          id: 'p1', location: 'ceres', verified: true, rating: 4.5, reviewCount: 10, ProfilePicture: null,
          user: { firstName: 'Ana', lastName: 'García', verified: true },
        },
      },
      {
        id: 's2', title: 'T2', description: 'D2', priceRange: '$$',
        category: { name: 'Cat 2' },
        professional: {
          id: 'p2', location: 'hersilia', verified: true, rating: 5, reviewCount: 3, ProfilePicture: null,
          user: { firstName: 'Juan', lastName: 'Pérez', verified: true },
        },
      },
    ])

    const req = makeRequest('http://localhost/api/services?limit=10&page=1&q=abc&grupo=oficios&categoria=plomero&location=ceres')
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.pagination.total).toBe(2)
    expect(json.pagination.totalPages).toBe(1)
    expect(json.data[0]).toMatchObject({ id: 's1', category: { name: 'Cat 1' } })
  })
})

describe('POST /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('401 si no hay sesión', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce(null)
    const req = makeRequest('http://localhost/api/services', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('400 si faltan campos requeridos', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } })
    const req = makeRequest('http://localhost/api/services', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '', description: '', categorySlug: '' })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('404 si el usuario no es profesional', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } })
    hoisted.prismaMock.professional.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('http://localhost/api/services', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 't', description: 'd', categorySlug: 'slug' })
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('404 si la categoría no existe y no está en taxonomy', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } })
    hoisted.prismaMock.professional.findUnique.mockResolvedValueOnce({ id: 'p1', professionalGroup: 'oficios' })
    hoisted.prismaMock.category.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('http://localhost/api/services', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 't', description: 'd', categorySlug: 'categoria-inexistente' })
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('201 crea servicio cuando la categoría existe', async () => {
    hoisted.getServerSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } })
    hoisted.prismaMock.professional.findUnique.mockResolvedValueOnce({ id: 'p1', professionalGroup: 'oficios' })
    hoisted.prismaMock.category.findUnique.mockResolvedValueOnce({ id: 'c1', slug: 'plomero' })
    hoisted.prismaMock.service.create.mockResolvedValueOnce({ id: 's1' })
    const req = makeRequest('http://localhost/api/services', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 't', description: 'd', categorySlug: 'plomero' })
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})


