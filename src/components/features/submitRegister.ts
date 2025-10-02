import type { CategoryGroup } from '@/types'

type RegisterFn = (payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  location?: string
  bio?: string
  experienceYears?: number
  professionalGroup?: CategoryGroup
  whatsapp?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  website?: string
  portfolio?: string
  cv?: string
  picture?: string
  services: Array<{ categoryId: string; title: string; description: string }>
}) => Promise<void>

export async function submitRegister(
  payload: Parameters<RegisterFn>[0],
  deps: { register: RegisterFn; push: (url: string) => void }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deps.register(payload)
    deps.push('/auth/registro/exito')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al registrar. Intenta nuevamente.'
    return { ok: false, error: msg }
  }
}


