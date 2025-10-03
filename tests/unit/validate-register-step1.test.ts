import { describe, it, expect } from 'vitest'
import { validateRegisterStep1, type Step1Data } from '@/app/auth/registro/_components/validate'

function base(): Step1Data {
  return {
    firstName: 'Ana',
    lastName: 'García',
    birthDate: '2000-01-01',
    email: 'ana@test.com',
    confirmEmail: 'ana@test.com',
    phone: '3491000000',
    password: 'Secret1',
    confirmPassword: 'Secret1',
    acceptTerms: true,
  }
}

describe('validateRegisterStep1', () => {
  it('sin errores con datos válidos', () => {
    const errors = validateRegisterStep1(base())
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('requiere mayor de 18', () => {
    const d = base()
    d.birthDate = '2010-01-01'
    const errors = validateRegisterStep1(d)
    expect(errors.birthDate).toContain('mayor de 18')
  })

  it('valida formato de email y confirmación', () => {
    const d = base()
    d.email = 'invalido'
    d.confirmEmail = 'otro@test.com'
    const errors = validateRegisterStep1(d)
    expect(errors.email).toContain('válido')
    expect(errors.confirmEmail).toContain('no coinciden')
  })

  it('contraseña corta y confirmación distinta', () => {
    const d = base()
    d.password = '123'
    d.confirmPassword = '1234'
    const errors = validateRegisterStep1(d)
    expect(errors.password).toContain('al menos 6')
    expect(errors.confirmPassword).toContain('no coinciden')
  })

  it('debe aceptar términos', () => {
    const d = base()
    d.acceptTerms = false
    const errors = validateRegisterStep1(d)
    expect(errors.acceptTerms).toContain('términos')
  })
})


