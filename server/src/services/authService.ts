import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { conflict, HttpError } from '../errors.ts'
import { permissionsFor, type Role } from '../permissions.ts'
import type { UserRepository } from '../repositories/userRepository.ts'
import type { LoginResponse, PublicUser, UserRecord } from '../types.ts'
import { displayNameFromEmail, validateEmail, validatePassword } from '../validation/auth.ts'

const TOKEN_TTL = '12h'
const PASSWORD_SALT_ROUNDS = 10

function isUniqueEmailError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE' &&
      String(error).includes('email'),
  )
}

function validationError(email: string, password: string): void {
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)

  if (!emailError && !passwordError) {
    return
  }

  throw new HttpError(400, 'validation_error', 'Please fix the errors below to continue.', [
    ...(emailError ? [{ field: 'email', message: emailError, code: 'invalid_format' }] : []),
    ...(passwordError
      ? [{ field: 'password', message: passwordError, code: 'invalid_format' }]
      : []),
  ])
}

interface JwtPayload {
  sub: string
  email: string
  role: Role
}

export function toPublicUser(user: {
  id: string
  email: string
  role: Role
  displayName: string
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  }
}

function issueSession(jwtSecret: string, user: UserRecord): LoginResponse {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role } satisfies JwtPayload,
    jwtSecret,
    { expiresIn: TOKEN_TTL },
  )

  return {
    user: toPublicUser(user),
    token,
    permissions: permissionsFor(user.role),
  }
}

export function createAuthService(users: UserRepository, jwtSecret: string) {
  return {
    login(input: { email?: unknown; password?: unknown }): LoginResponse {
      const email = typeof input.email === 'string' ? input.email : ''
      const password = typeof input.password === 'string' ? input.password : ''
      validationError(email, password)

      const user = users.findByEmail(email.trim().toLowerCase())
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        throw new HttpError(401, 'invalid_credentials', 'Invalid email or password')
      }

      const now = new Date().toISOString()
      users.updateLastLogin(user.id, now)
      return issueSession(jwtSecret, user)
    },

    signup(input: { email?: unknown; password?: unknown }): LoginResponse {
      const email = typeof input.email === 'string' ? input.email : ''
      const password = typeof input.password === 'string' ? input.password : ''
      validationError(email, password)

      const normalizedEmail = email.trim().toLowerCase()
      if (users.findByEmail(normalizedEmail)) {
        throw conflict('An account with this email already exists')
      }

      const now = new Date().toISOString()
      const user: UserRecord = {
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash: bcrypt.hashSync(password, PASSWORD_SALT_ROUNDS),
        displayName: displayNameFromEmail(normalizedEmail),
        role: 'member',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      }

      try {
        users.insert(user)
      } catch (error) {
        if (isUniqueEmailError(error)) {
          throw conflict('An account with this email already exists')
        }
        throw error
      }

      return issueSession(jwtSecret, user)
    },

    verify(token: string): PublicUser {
      try {
        const payload = jwt.verify(token, jwtSecret) as JwtPayload
        const user = users.findById(payload.sub)
        if (!user) {
          throw new HttpError(401, 'unauthorized', 'Invalid or expired token')
        }
        return toPublicUser(user)
      } catch (error) {
        if (error instanceof HttpError) throw error
        throw new HttpError(401, 'unauthorized', 'Invalid or expired token')
      }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
