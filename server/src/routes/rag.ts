import { Router } from 'express'
import { can } from '../permissions.ts'
import { forbidden } from '../errors.ts'
import { routeParam, sendData } from '../http.ts'
import { createAuthMiddleware, getActor, requirePermission } from '../middleware/auth.ts'
import type { AuthService } from '../services/authService.ts'
import type { IngestionService } from '../services/ingestionService.ts'
import { ragFileIdParamSchema } from '../validation/rag.ts'

export function createRagRouter(auth: AuthService, ingestion: IngestionService): Router {
  const router = Router()
  const requireAuth = createAuthMiddleware(auth)

  router.use(requireAuth)

  router.post('/ingest/:fileId', (req, res, next) => {
    try {
      const actor = getActor(res)
      if (!can(actor.role, 'uploads:create') && !can(actor.role, 'artifacts:manage')) {
        throw forbidden()
      }
      const { fileId } = ragFileIdParamSchema.parse({
        fileId: routeParam(req.params.fileId),
      })
      sendData(res, ingestion.enqueue(fileId), 202)
    } catch (error) {
      next(error)
    }
  })

  router.get('/ingest/:fileId/status', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      const { fileId } = ragFileIdParamSchema.parse({
        fileId: routeParam(req.params.fileId),
      })
      sendData(res, ingestion.getStatus(fileId))
    } catch (error) {
      next(error)
    }
  })

  return router
}
