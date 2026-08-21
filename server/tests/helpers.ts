import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { createApp } from '../src/app.ts'
import { openMemoryDatabase, type SqliteDatabase } from '../src/db/client.ts'
import { migrate } from '../src/db/migrate.ts'
import { seedDatabase } from '../seeds/seed.ts'

export const JWT_SECRET = 'test-secret'

export interface TestContext {
  app: ReturnType<typeof createApp>
  db: SqliteDatabase
  uploadDir: string
  dir: string
}

export function createTestContext(): TestContext {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'confluence-api-'))
  const uploadDir = path.join(dir, 'uploads')
  fs.mkdirSync(uploadDir, { recursive: true })
  const db = openMemoryDatabase()
  migrate(db)
  seedDatabase(db, uploadDir)
  const app = createApp({
    db,
    jwtSecret: JWT_SECRET,
    uploadDir,
    disableRateLimit: true,
  })
  return { app, db, uploadDir, dir }
}

export function closeTestContext(ctx: TestContext): void {
  ctx.db.close()
  fs.rmSync(ctx.dir, { recursive: true, force: true })
}

export async function login(
  app: TestContext['app'],
  email = 'admin@thoughtfocus.com',
  password = 'Admin123!',
): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password })
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(response.body)}`)
  }
  return response.body.data.token as string
}

export function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}
