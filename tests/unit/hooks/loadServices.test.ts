import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../testServer'
import { loadServices } from '@/hooks/loadServices'

describe('loadServices', () => {
  it('retorna datos y paginación cuando success=true', async () => {
    server.use(
      http.get('/api/services', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: '1', professionalId: 'p1', categoryId: 'c1', title: 'S1', description: 'd', priceRange: '$', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
        })
      })
    )

    const res = await loadServices()
    expect(res.success).toBe(true)
    expect(res.data.length).toBe(1)
    expect(res.total).toBe(1)
    expect(res.totalPages).toBe(1)
  })

  it('retorna mensaje cuando success=false', async () => {
    server.use(
      http.get('/api/services', () => {
        return HttpResponse.json({ success: false, message: 'Fallo' }, { status: 400 })
      })
    )

    const res = await loadServices()
    expect(res.success).toBe(false)
    expect(res.message).toBe('Fallo')
  })
})


