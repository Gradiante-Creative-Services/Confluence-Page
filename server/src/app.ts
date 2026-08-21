import express from 'express'
import helmet from 'helmet'
import type { SqliteDatabase } from './db/client.ts'
import { errorHandler } from './http.ts'
import { createArtifactRepository } from './repositories/artifactRepository.ts'
import { createFileRepository } from './repositories/fileRepository.ts'
import { createUserRepository } from './repositories/userRepository.ts'
import { createAuthRouter } from './routes/auth.ts'
import { createArtifactRouter } from './routes/artifacts.ts'
import { createHealthRouter } from './routes/health.ts'
import { createUserRouter } from './routes/users.ts'
import { createArtifactService } from './services/artifactService.ts'
import { createAuthService } from './services/authService.ts'
import { createFileService } from './services/fileService.ts'
import { createUserService } from './services/userService.ts'

export interface AppOptions {
  db: SqliteDatabase
  jwtSecret: string
  uploadDir: string
  disableRateLimit?: boolean
}

export function createApp(options: AppOptions) {
  const users = createUserRepository(options.db)
  const artifacts = createArtifactRepository(options.db)
  const files = createFileRepository(options.db)
  const auth = createAuthService(users, options.jwtSecret)
  const userService = createUserService(users)
  const artifactService = createArtifactService(artifacts, files)
  const fileService = createFileService(artifacts, files, options.uploadDir)

  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/v1', createHealthRouter(options.db))
  app.use('/api/v1/auth', createAuthRouter(auth, { disableRateLimit: options.disableRateLimit }))
  app.use('/api/v1/users', createUserRouter(auth, userService))
  app.use('/api/v1/artifacts', createArtifactRouter(auth, artifactService, fileService))

  app.use(errorHandler)
  return app
}
