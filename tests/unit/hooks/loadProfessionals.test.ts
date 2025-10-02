import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../testServer'
import { loadProfessionals } from '@/hooks/loadProfessionals'

describe('loadProfessionals', () => {
  it('devuelve datos y paginación', async () => {
    server.use(
      http.get('/api/professionals', () => {
        return HttpResponse.json({
          success: true,
          data: [ { id: 'p1', userId: 'u1', bio: 'b', experienceYears: 1, verified: true, status: 'active', rating: 0, reviewCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } ],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
        })
      })
    )

    const res = await loadProfessionals()
    expect(res.success).toBe(true)
    expect(res.data.length).toBe(1)
    expect(res.total).toBe(1)
    expect(res.totalPages).toBe(1)
  })

  it('retorna mensaje en error', async () => {
    server.use(http.get('/api/professionals', () => HttpResponse.json({ success: false, message: 'Fallo' }, { status: 400 })))
    const res = await loadProfessionals()
    expect(res.success).toBe(false)
    expect(res.message).toBe('Fallo')
  })
})


