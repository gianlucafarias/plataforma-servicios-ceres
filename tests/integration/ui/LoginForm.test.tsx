import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/features/LoginForm'

const hoisted = vi.hoisted(() => ({
  loginMock: vi.fn(),
  pushMock: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ login: hoisted.loginMock }) }))
vi.mock('next/navigation', async (orig) => {
  const actual = await orig()
  return { ...actual, useRouter: () => ({ push: hoisted.pushMock }) }
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inicia sesión correctamente y redirige', async () => {
    hoisted.loginMock.mockResolvedValueOnce(undefined)
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password1' } })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => expect(hoisted.pushMock).toHaveBeenCalledWith('/dashboard'))
  })

  it('muestra error si el login falla', async () => {
    hoisted.loginMock.mockRejectedValueOnce(new Error('Credenciales inválidas'))
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument())
    expect(hoisted.pushMock).not.toHaveBeenCalled()
  })
})


