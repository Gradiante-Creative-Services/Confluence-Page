import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { createApp } from '../src/app.ts'
import { openMemoryDatabase, type SqliteDatabase } from '../src/db/client.ts'
import { migrate } from '../src/db/migrate.ts'
import { seedDatabase } from '../seeds/seed.ts'
import type { GeminiClient } from '../src/services/geminiClient.ts'

export const JWT_SECRET = 'test-secret'

/** Deterministic fake embeddings so RAG tests never call live Gemini. */
export function createFakeGeminiClient(): GeminiClient {
  function embed(text: string): number[] {
    const vector = new Array<number>(8).fill(0)
    const normalized = text.toLowerCase()
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i)
      vector[i % vector.length] += (code % 31) / 31
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
    return vector.map((value) => value / norm)
  }

  return {
    async embedTexts(texts: string[]): Promise<number[][]> {
      return texts.map(embed)
    },
    async generateChat(_systemPrompt: string, userMessage: string): Promise<string> {
      const match = /Question:\s*(.*)$/s.exec(userMessage)
      const question = match?.[1]?.trim() || userMessage
      return `Based on the documents: ${question.slice(0, 120)}`
    },
  }
}

export interface TestContext {
  app: ReturnType<typeof createApp>
  db: SqliteDatabase
  uploadDir: string
  dir: string
}

export function createTestContext(gemini?: GeminiClient): TestContext {
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
    gemini: gemini ?? createFakeGeminiClient(),
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
