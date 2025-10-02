type LoginFn = (email: string, password: string) => Promise<void>

export async function submitLogin(
  email: string,
  password: string,
  deps: { login: LoginFn; push: (url: string) => void }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deps.login(email, password)
    deps.push('/dashboard')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al iniciar sesión'
    return { ok: false, error: msg }
  }
}


