import bcrypt from 'bcrypt'
import { getDb } from '../db/connection.js'
import { AppError } from '../errors/AppError.js'
import type { UserRow } from '../types/models.js'

export interface AuthUser {
  id: number
  email: string
  displayName: string | null
  role: UserRow['role']
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }
}

export function login(email: string, password: string): AuthUser {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase()) as UserRow | undefined

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  return toAuthUser(row)
}

export function signup(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): AuthUser {
  const normalizedEmail = email.trim().toLowerCase()
  const db = getDb()

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'An account with this email already exists')
  }

  const displayName = `${firstName.trim()} ${lastName.trim()}`
  const passwordHash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()

  const result = db
    .prepare(
      `
      INSERT INTO users (email, password_hash, display_name, first_name, last_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'member', ?, ?)
    `,
    )
    .run(normalizedEmail, passwordHash, displayName, firstName.trim(), lastName.trim(), now, now)

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow
  return toAuthUser(row)
}

export function getUserById(id: number): AuthUser | null {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  return row ? toAuthUser(row) : null
}
