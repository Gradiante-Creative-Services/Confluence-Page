import type { SqliteDatabase } from '../db/client.ts'
import type { Role } from '../permissions.ts'
import type { UserRecord } from '../types.ts'

interface UserRow {
  id: string
  email: string
  password_hash: string
  display_name: string
  role: Role
  created_at: string
  updated_at: string
  last_login_at: string | null
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  }
}

export function createUserRepository(db: SqliteDatabase) {
  const findByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
  const findByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?')
  const countStmt = db.prepare('SELECT COUNT(*) AS total FROM users')
  const listStmt = db.prepare(
    'SELECT * FROM users ORDER BY created_at ASC LIMIT ? OFFSET ?',
  )
  const insertStmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at, last_login_at)
    VALUES (@id, @email, @password_hash, @display_name, @role, @created_at, @updated_at, @last_login_at)
  `)
  const upsertByEmailStmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at, last_login_at)
    VALUES (@id, @email, @password_hash, @display_name, @role, @created_at, @updated_at, @last_login_at)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      display_name = excluded.display_name,
      role = excluded.role,
      updated_at = excluded.updated_at
  `)
  const touchLoginStmt = db.prepare(
    'UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?',
  )

  return {
    findByEmail(email: string): UserRecord | null {
      const row = findByEmailStmt.get(email) as UserRow | undefined
      return row ? mapUser(row) : null
    },
    findById(id: string): UserRecord | null {
      const row = findByIdStmt.get(id) as UserRow | undefined
      return row ? mapUser(row) : null
    },
    count(): number {
      return (countStmt.get() as { total: number }).total
    },
    list(limit: number, offset: number): UserRecord[] {
      return (listStmt.all(limit, offset) as UserRow[]).map(mapUser)
    },
    insert(user: UserRecord): void {
      insertStmt.run({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        display_name: user.displayName,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_login_at: user.lastLoginAt,
      })
    },
    upsertByEmail(user: UserRecord): void {
      upsertByEmailStmt.run({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        display_name: user.displayName,
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_login_at: user.lastLoginAt,
      })
    },
    updateLastLogin(id: string, at: string): void {
      touchLoginStmt.run(at, at, id)
    },
  }
}

export type UserRepository = ReturnType<typeof createUserRepository>
