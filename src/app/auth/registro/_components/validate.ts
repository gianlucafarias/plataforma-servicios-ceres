export type Step1Data = {
  firstName: string
  lastName: string
  birthDate: string
  email: string
  confirmEmail: string
  phone: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export function validateRegisterStep1(data: Step1Data): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es requerida'
  } else {
    const birthDate = new Date(data.birthDate)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
    if (actualAge < 18) errors.birthDate = 'Debes ser mayor de 18 años para registrarte'
  }

  if (!data.firstName.trim()) errors.firstName = 'El nombre es requerido'
  if (!data.lastName.trim()) errors.lastName = 'El apellido es requerido'

  if (!data.email.trim()) errors.email = 'El email es requerido'
  else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Ingresa un email válido'

  if (!data.confirmEmail.trim()) errors.confirmEmail = 'Confirma tu email'
  else if (data.email !== data.confirmEmail) errors.confirmEmail = 'Los emails no coinciden'

  if (!data.phone.trim()) errors.phone = 'El teléfono es requerido'

  if (!data.password.trim()) errors.password = 'La contraseña es requerida'
  else if (data.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres'

  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden'

  if (!data.acceptTerms) errors.acceptTerms = 'Debes aceptar los términos y condiciones'

  return errors
}

export type Step2Data = {
  bio: string
  experienceYears: string | number
  professionalGroup: '' | 'oficios' | 'profesiones'
}

export function validateRegisterStep2(data: Step2Data): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.bio?.toString().trim()) errors.bio = 'La descripción profesional es requerida'
  const years = Number(data.experienceYears)
  if (!Number.isFinite(years) || years < 0) errors.experienceYears = 'Los años de experiencia son requeridos'
  if (!data.professionalGroup) errors.professionalGroup = 'Debes elegir si ofreces Oficios o Profesiones'
  return errors
}

export type Step3Service = { categoryId: string; description: string }
export function validateRegisterStep3(services: Step3Service[]): Record<string, string> {
  const errors: Record<string, string> = {}
  services.forEach((s, index) => {
    if (!s.categoryId) errors[`service_${index}_category`] = 'La categoría es requerida'
    if (!s.description?.toString().trim()) errors[`service_${index}_description`] = 'La descripción es requerida'
  })
  return errors
}


