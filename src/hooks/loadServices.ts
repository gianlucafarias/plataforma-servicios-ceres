import { Service } from '@/types'

export type ServiceFilters = {
  q?: string
  grupo?: 'oficios' | 'profesiones'
  categoria?: string
  location?: string
  page?: number
  limit?: number
}

type LoadServicesOptions = {
  signal?: AbortSignal
}

export async function loadServices(
  filters: ServiceFilters = {},
  options: LoadServicesOptions = {}
): Promise<{
  success: boolean
  data: Service[]
  total: number
  totalPages: number
  message?: string
}> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.grupo) params.set('grupo', filters.grupo)
  if (filters.categoria) params.set('categoria', filters.categoria)
  if (filters.location) params.set('location', filters.location)
  params.set('limit', String(filters.limit ?? 20))
  params.set('page', String(filters.page ?? 1))

  const res = await fetch(`/api/services?${params.toString()}`, {
    signal: options.signal,
  })
  const json = await res.json()
  if (json.success) {
    const data = json.data as Service[]
    const total = json.pagination?.total ?? data.length
    const totalPages = json.pagination?.totalPages ?? 1
    return { success: true, data, total, totalPages }
  }
  return { success: false, data: [], total: 0, totalPages: 0, message: json.message || 'No se pudieron cargar los servicios' }
}


