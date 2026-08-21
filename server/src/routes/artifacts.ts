import { Router } from 'express'
import multer from 'multer'
import { buildLinks, parsePage, routeParam, sendData } from '../http.ts'
import { createAuthMiddleware, getActor, requirePermission } from '../middleware/auth.ts'
import type { AuthService } from '../services/authService.ts'
import type { ArtifactService } from '../services/artifactService.ts'
import type { FileService } from '../services/fileService.ts'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})

export function createArtifactRouter(
  auth: AuthService,
  artifacts: ArtifactService,
  files: FileService,
): Router {
  const router = Router()
  const requireAuth = createAuthMiddleware(auth)

  router.use(requireAuth)

  router.get('/', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      const result = artifacts.list(req.query as Record<string, unknown>)
      const query: Record<string, string | undefined> = {
        folder: typeof req.query.folder === 'string' ? req.query.folder : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
      }
      sendData(res, result.data, 200, {
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: Math.max(1, Math.ceil(result.total / result.perPage) || 1),
          folderCounts: result.folderCounts,
        },
        links: buildLinks('/api/v1/artifacts', result.page, result.perPage, result.total, query),
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/', requirePermission('artifacts:manage'), (req, res, next) => {
    try {
      const created = artifacts.create(req.body, getActor(res))
      res.setHeader('Location', `/api/v1/artifacts/${created.id}`)
      sendData(res, artifacts.getById(created.id), 201)
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      sendData(res, artifacts.getById(routeParam(req.params.id)))
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:id', requirePermission('artifacts:manage'), (req, res, next) => {
    try {
      artifacts.update(routeParam(req.params.id), req.body, getActor(res))
      sendData(res, artifacts.getById(routeParam(req.params.id)))
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:id', requirePermission('artifacts:manage'), (req, res, next) => {
    try {
      const current = artifacts.delete(routeParam(req.params.id))
      files.deleteArtifactDirectory(current.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id/files', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      const { page, perPage } = parsePage(req.query)
      const result = files.list(routeParam(req.params.id), page, perPage)
      sendData(res, result.data, 200, {
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
          totalPages: Math.max(1, Math.ceil(result.total / result.perPage) || 1),
        },
        links: buildLinks(
          `/api/v1/artifacts/${req.params.id}/files`,
          result.page,
          result.perPage,
          result.total,
          {},
        ),
      })
    } catch (error) {
      next(error)
    }
  })

  router.post(
    '/:id/files',
    requirePermission('uploads:create'),
    upload.single('file'),
    (req, res, next) => {
      try {
        const created = files.create(routeParam(req.params.id), getActor(res), req.file)
        res.setHeader('Location', `/api/v1/artifacts/${req.params.id}/files/${created.id}`)
        sendData(res, created, 201)
      } catch (error) {
        next(error)
      }
    },
  )

  router.get('/:id/files/:fileId/download', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      const { file, diskPath } = files.absolutePath(
        routeParam(req.params.id),
        routeParam(req.params.fileId),
      )
      res.setHeader('Content-Type', file.mimeType)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      )
      res.sendFile(diskPath)
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id/files/:fileId', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      sendData(res, files.getById(routeParam(req.params.id), routeParam(req.params.fileId)))
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:id/files/:fileId', requirePermission('artifacts:read'), (req, res, next) => {
    try {
      files.delete(routeParam(req.params.id), routeParam(req.params.fileId), getActor(res))
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  return router
}
