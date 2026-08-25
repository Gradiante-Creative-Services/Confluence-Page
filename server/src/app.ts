import express from 'express'
import helmet from 'helmet'
import type { SqliteDatabase } from './db/client.ts'
import { errorHandler } from './http.ts'
import { createArtifactRepository } from './repositories/artifactRepository.ts'
import { createChunkRepository } from './repositories/chunkRepository.ts'
import { createFileRepository } from './repositories/fileRepository.ts'
import { createIngestionJobRepository } from './repositories/ingestionJobRepository.ts'
import { createUserRepository } from './repositories/userRepository.ts'
import { createAuthRouter } from './routes/auth.ts'
import { createArtifactRouter } from './routes/artifacts.ts'
import { createChatRouter } from './routes/chat.ts'
import { createHealthRouter } from './routes/health.ts'
import { createRagRouter } from './routes/rag.ts'
import { createUserRouter } from './routes/users.ts'
import { createArtifactService } from './services/artifactService.ts'
import { createAuthService } from './services/authService.ts'
import { createChatService } from './services/chatService.ts'
import { createFileService } from './services/fileService.ts'
import { createGeminiClient, type GeminiClient } from './services/geminiClient.ts'
import { createIngestionService } from './services/ingestionService.ts'
import { createUserService } from './services/userService.ts'

export interface AppOptions {
  db: SqliteDatabase
  jwtSecret: string
  uploadDir: string
  disableRateLimit?: boolean
  geminiApiKey?: string
  gemini?: GeminiClient
  /** Queue ingest for files missing a successful job (boot backfill). */
  backfillIngestOnStart?: boolean
}

export function createApp(options: AppOptions) {
  const users = createUserRepository(options.db)
  const artifacts = createArtifactRepository(options.db)
  const files = createFileRepository(options.db)
  const chunks = createChunkRepository(options.db)
  const ingestionJobs = createIngestionJobRepository(options.db)
  const gemini = options.gemini ?? createGeminiClient(options.geminiApiKey)

  const auth = createAuthService(users, options.jwtSecret)
  const userService = createUserService(users)
  const artifactService = createArtifactService(artifacts, files)
  const fileService = createFileService(artifacts, files, options.uploadDir)
  const ingestionService = createIngestionService(
    files,
    ingestionJobs,
    chunks,
    gemini,
    options.uploadDir,
  )
  const chatService = createChatService(chunks, gemini)

  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/v1', createHealthRouter(options.db))
  app.use('/api/v1/auth', createAuthRouter(auth, { disableRateLimit: options.disableRateLimit }))
  app.use('/api/v1/users', createUserRouter(auth, userService))
  app.use(
    '/api/v1/artifacts',
    createArtifactRouter(auth, artifactService, fileService, ingestionService),
  )
  app.use('/api/v1/rag', createRagRouter(auth, ingestionService))
  app.use('/api/v1/chat', createChatRouter(auth, chatService))

  app.use(errorHandler)

  if (options.backfillIngestOnStart) {
    setImmediate(() => {
      const queued = ingestionService.backfillPending()
      if (queued > 0) {
        console.log(`RAG backfill queued for ${queued} file(s)`)
      }
    })
  }

  return app
}
