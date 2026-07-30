import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('../../../', import.meta.url)))
config({ path: resolve(rootDir, '.env') })

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databasePath: resolve(rootDir, process.env.DATABASE_PATH ?? './data/artifact-hub.db'),
  jwtSecret: requireEnv('JWT_SECRET', 'dev-only-change-in-production'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtExpiresIn: 28800,
  rootDir,
}
