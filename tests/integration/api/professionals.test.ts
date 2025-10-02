import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as GET_LIST } from '@/app/api/professionals/route'
import { GET as GET_DETAIL } from '@/app/api/professional/[id]/route'

const hoisted = vi.hoisted(() => ({
  prismaMock: {
    professional: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: hoisted.prismaMock }))

function makeRequest(url: string) {
  const req = new Request(url)
  return new NextRequest(req)
}

describe('GET /api/professionals', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna lista con paginación y mapeo de datos', async () => {
    hoisted.prismaMock.professional.count.mockResolvedValueOnce(2)
    hoisted.prismaMock.professional.findMany.mockResolvedValueOnce([
      {
        id: 'p1', bio: 'bio1', verified: true, location: 'ceres', rating: 4.2, reviewCount: 5, ProfilePicture: null,
        user: { firstName: 'Ana', lastName: 'García', verified: true },
        services: [{ category: { name: 'Plomería' } }],
      },
      {
        id: 'p2', bio: 'bio2', verified: false, location: 'hersilia', rating: 0, reviewCount: 0, ProfilePicture: null,
        user: { firstName: 'Juan', lastName: 'Pérez', verified: true },
        services: [],
      },
    ])

    const res = await GET_LIST(makeRequest('http://localhost/api/professionals?limit=10&page=1&grupo=oficios&categoria=plomero&location=ceres&sortBy=recent'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.pagination.total).toBe(2)
    expect(json.data[0]).toMatchObject({ id: 'p1', user: { name: 'Ana García' }, primaryCategory: { name: 'Plomería' } })
  })
})

describe('GET /api/professional/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('404 cuando no existe', async () => {
    hoisted.prismaMock.professional.findUnique.mockResolvedValueOnce(null)
    const res = await GET_DETAIL(makeRequest('http://localhost/api/professional/xxx'), { params: Promise.resolve({ id: 'xxx' }) })
    expect(res.status).toBe(404)
  })

  it('200 devuelve profesional', async () => {
    hoisted.prismaMock.professional.findUnique.mockResolvedValueOnce({ id: 'p1' })
    const res = await GET_DETAIL(makeRequest('http://localhost/api/professional/p1'), { params: Promise.resolve({ id: 'p1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('p1')
  })
})


