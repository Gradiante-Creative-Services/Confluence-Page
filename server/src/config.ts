import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config()

export interface AppConfig {
  port: number
  databasePath: string
  jwtSecret: string
  uploadDir: string
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProduction = env.NODE_ENV === 'production'
  const jwtSecret = env.JWT_SECRET ?? (isProduction ? '' : 'dev-insecure-secret')

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required')
  }

  return {
    port: Number(env.PORT) || 3001,
    databasePath: path.resolve(env.DATABASE_PATH ?? './data/confluence.db'),
    jwtSecret,
    uploadDir: path.resolve(env.UPLOAD_DIR ?? './data/uploads'),
  }
}
