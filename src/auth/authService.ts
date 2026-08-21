import { clearSession, loadSession, saveSession } from './session'
import type { AuthSession, FieldErrors } from './types'

export type AuthOutcome =
  | { ok: true; session: AuthSession }
  | {
      ok: false
      code: 'VALIDATION' | 'INVALID_CREDENTIALS' | 'LIVE_UNAVAILABLE' | 'EMAIL_TAKEN'
      message: string
      errors?: FieldErrors
    }

export type LoginOutcome = AuthOutcome
export type SignupOutcome = AuthOutcome

async function postCredentials(
  path: string,
  email: string,
  password: string,
  unavailableMessage: string,
): Promise<AuthOutcome> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return {
      ok: false,
      code: 'LIVE_UNAVAILABLE',
      message: 'Could not reach the API. Start the server with npm run dev, then try again.',
    }
  }

  const body = (await response.json().catch(() => ({}))) as {
    data?: { user?: AuthSession['user']; token?: string }
    error?: {
      code?: string
      message?: string
      details?: Array<{ field: string; message: string }>
    }
  }

  if (response.ok && body.data?.user && body.data.token) {
    const session: AuthSession = {
      user: body.data.user,
      token: body.data.token,
      apiMode: 'live',
    }
    saveSession(session)
    return { ok: true, session }
  }

  if (response.status === 400) {
    const errors: FieldErrors = {}
    for (const detail of body.error?.details ?? []) {
      if (detail.field === 'email' || detail.field === 'password') {
        errors[detail.field] = detail.message
      }
    }
    return {
      ok: false,
      code: 'VALIDATION',
      message: body.error?.message ?? 'Please fix the errors below to continue.',
      errors,
    }
  }

  if (response.status === 401) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: body.error?.message ?? 'Invalid email or password',
    }
  }

  if (response.status === 409) {
    const message = body.error?.message ?? 'An account with this email already exists'
    return {
      ok: false,
      code: 'EMAIL_TAKEN',
      message,
      errors: { email: message },
    }
  }

  return {
    ok: false,
    code: 'LIVE_UNAVAILABLE',
    message: body.error?.message ?? unavailableMessage,
  }
}

export async function login(email: string, password: string): Promise<LoginOutcome> {
  return postCredentials('/api/v1/auth/login', email, password, 'Could not sign in. Try again.')
}

export async function signup(email: string, password: string): Promise<SignupOutcome> {
  return postCredentials(
    '/api/v1/auth/signup',
    email,
    password,
    'Could not create your account. Try again.',
  )
}

export function logout(): void {
  clearSession()
}

export function restoreSession(): AuthSession | null {
  return loadSession()
}
