export type ApiMode = 'mock' | 'live'
export type Role = 'admin' | 'member'
export type Permission =
  | 'artifacts:read'
  | 'artifacts:manage'
  | 'uploads:create'
  | 'chat:ask'

export interface AuthUser {
  id: string
  email: string
  role: Role
  displayName: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  apiMode: ApiMode
}

export interface FieldErrors {
  email?: string
  password?: string
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; code: 'VALIDATION'; errors: FieldErrors; message: string }
  | { ok: false; code: 'INVALID_CREDENTIALS'; message: string }
