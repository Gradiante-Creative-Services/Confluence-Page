import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.routes.js'
import { foldersRouter } from './routes/folders.routes.js'
import { artifactsRouter } from './routes/artifacts.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { uploadsRouter } from './routes/uploads.routes.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/folders', foldersRouter)
  app.use('/api/artifacts', artifactsRouter)
  app.use('/api/uploads', uploadsRouter)

  app.use(errorHandler)

  return app
}
