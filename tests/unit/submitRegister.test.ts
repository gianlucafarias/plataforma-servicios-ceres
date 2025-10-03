import { describe, it, expect, vi } from 'vitest'
import { submitRegister } from '@/components/features/submitRegister'

const basePayload = {
  email: 'a@a.com',
  password: 'Secret1',
  firstName: 'Ana',
  lastName: 'García',
  location: 'ceres',
  bio: 'desc',
  experienceYears: 3,
  professionalGroup: 'oficios' as const,
  services: [{ categoryId: 'plomero', title: 'Plomería', description: 'Trabajos' }],
}

describe('submitRegister', () => {
  it('redirige a exito cuando el registro es exitoso', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    const push = vi.fn()
    const res = await submitRegister(basePayload, { register, push })
    expect(res.ok).toBe(true)
    expect(push).toHaveBeenCalledWith('/auth/registro/exito')
  })

  it('devuelve error cuando el registro falla', async () => {
    const register = vi.fn().mockRejectedValue(new Error('Email duplicado'))
    const push = vi.fn()
    const res = await submitRegister(basePayload, { register, push })
    expect(res.ok).toBe(false)
    if (res.ok === false) {
      expect(res.error).toContain('Email duplicado')
    }
    expect(push).not.toHaveBeenCalled()
  })
})


