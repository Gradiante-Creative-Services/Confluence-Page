import type { AuthResult, AuthUser } from './types'
import { validateEmail, validatePassword } from './validation'

export interface DemoUser extends AuthUser {
  password: string
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@thoughtfocus.com',
    password: 'Admin123!',
    role: 'admin',
    displayName: 'Program Admin',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'member@thoughtfocus.com',
    password: 'Member123!',
    role: 'member',
    displayName: 'Cohort Member',
  },
]

export function authenticateCredentials(email: string, password: string): AuthResult {
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)

  if (emailError || passwordError) {
    return {
      ok: false,
      code: 'VALIDATION',
      errors: {
        ...(emailError ? { email: emailError } : {}),
        ...(passwordError ? { password: passwordError } : {}),
      },
      message: 'Please fix the errors below to continue.',
    }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const match = DEMO_USERS.find(
    (user) => user.email === normalizedEmail && user.password === password,
  )

  if (!match) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    }
  }

  return {
    ok: true,
    user: {
      id: match.id,
      email: match.email,
      role: match.role,
      displayName: match.displayName,
    },
  }
}
