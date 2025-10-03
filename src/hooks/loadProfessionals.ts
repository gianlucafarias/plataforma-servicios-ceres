import { Professional } from '@/types'

export type ProfessionalFilters = {
  q?: string
  categoria?: string
  grupo?: 'oficios' | 'profesiones'
  location?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'rating' | 'recent'
}

export async function loadProfessionals(filters: ProfessionalFilters = {}): Promise<{
  success: boolean
  data: Professional[]
  total: number
  totalPages: number
  message?: string
}> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.categoria) params.set('categoria', filters.categoria)
  if (filters.grupo) params.set('grupo', filters.grupo)
  if (filters.location) params.set('location', filters.location)
  params.set('limit', String(filters.limit ?? 12))
  params.set('page', String(filters.page ?? 1))
  params.set('sortBy', String(filters.sortBy ?? 'recent'))

  const res = await fetch(`/api/professionals?${params.toString()}`)
  const json = await res.json()
  if (json.success) {
    const data = json.data as Professional[]
    return {
      success: true,
      data,
      total: json.pagination?.total ?? data.length,
      totalPages: json.pagination?.totalPages ?? 1,
    }
  }
  return { success: false, data: [], total: 0, totalPages: 0, message: json.message || 'No se pudieron cargar los profesionales' }
}


