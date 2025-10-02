import { describe, it, expect } from 'vitest'
import { validateRegisterStep2, validateRegisterStep3 } from '@/app/auth/registro/_components/validate'

describe('validateRegisterStep2', () => {
  it('sin errores con datos válidos', () => {
    const errors = validateRegisterStep2({ bio: 'algo', experienceYears: 5, professionalGroup: 'oficios' })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('errores cuando faltan campos', () => {
    const errors = validateRegisterStep2({ bio: '', experienceYears: -1, professionalGroup: '' })
    expect(errors.bio).toBeTruthy()
    expect(errors.experienceYears).toBeTruthy()
    expect(errors.professionalGroup).toBeTruthy()
  })
})

describe('validateRegisterStep3', () => {
  it('sin errores cuando hay categoría y descripción', () => {
    const errors = validateRegisterStep3([{ categoryId: 'plomero', description: 'desc' }])
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('errores por faltantes por servicio', () => {
    const errors = validateRegisterStep3([{ categoryId: '', description: '' }, { categoryId: 'x', description: '' }])
    expect(errors['service_0_category']).toBeTruthy()
    expect(errors['service_0_description']).toBeTruthy()
    expect(errors['service_1_description']).toBeTruthy()
  })
})


