import { Router } from 'express'
import type { SqliteDatabase } from '../db/client.ts'
import { sendData, sendError } from '../http.ts'

export function createHealthRouter(db: SqliteDatabase): Router {
  const router = Router()

  router.get('/health', (_req, res) => {
    try {
      db.prepare('SELECT 1 AS ok').get()
      sendData(res, { status: 'ok', db: 'ok' })
    } catch {
      sendError(res, 503, 'service_unavailable', 'Database unavailable')
    }
  })

  return router
}
