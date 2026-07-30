import { Router } from 'express'
import { isDbConnected } from '../db/connection.js'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  const connected = isDbConnected()
  const payload = {
    status: connected ? 'ok' : 'degraded',
    db: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  }

  res.status(connected ? 200 : 503).json(payload)
})
