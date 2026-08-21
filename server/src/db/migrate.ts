import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SqliteDatabase } from './client.ts'

const defaultMigrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
)

export function migrate(
  db: SqliteDatabase,
  migrationsDir = defaultMigrationsDir,
): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const applied = new Set(
    db
      .prepare('SELECT id FROM schema_migrations')
      .all()
      .map((row) => (row as { id: string }).id),
  )

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  const ran: string[] = []

  for (const file of files) {
    if (applied.has(file)) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    db.exec(sql)
    db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(
      file,
      new Date().toISOString(),
    )
    ran.push(file)
  }

  return ran
}

export function getMigrationsDir(): string {
  return defaultMigrationsDir
}
