import { describe, it, expect, vi } from 'vitest'
import { submitLogin } from '@/components/features/submitLogin'

describe('submitLogin', () => {
  it('redirige al dashboard cuando el login es exitoso', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    const push = vi.fn()
    const res = await submitLogin('a@a.com', 'Secret1', { login, push })
    expect(res.ok).toBe(true)
    expect(push).toHaveBeenCalledWith('/dashboard')
  })

  it('retorna error cuando el login falla', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'))
    const push = vi.fn()
    const res = await submitLogin('a@a.com', 'Wrong', { login, push })
    expect(res.ok).toBe(false)
    if (res.ok === false) {
      expect(res.error).toContain('Credenciales inválidas')
    }
    expect(push).not.toHaveBeenCalled()
  })
})


