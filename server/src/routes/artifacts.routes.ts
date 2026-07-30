import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  artifactIdParamSchema,
  artifactListQuerySchema,
  createArtifactSchema,
  updateArtifactSchema,
} from '../schemas/artifacts.schema.js'
import {
  createArtifactFileSchema,
  artifactFileDeleteParamsSchema,
  artifactFileParamsSchema,
} from '../schemas/files.schema.js'
import * as artifactsService from '../services/artifacts.service.js'
import * as filesService from '../services/files.service.js'

export const artifactsRouter = Router()

artifactsRouter.get('/', authenticate, validate({ query: artifactListQuerySchema }), (req, res) => {
  res.json(artifactsService.listArtifacts(req.query))
})

artifactsRouter.get(
  '/:id',
  authenticate,
  validate({ params: artifactIdParamSchema }),
  (req, res) => {
    res.json(artifactsService.getArtifactById(req.params.id))
  },
)

artifactsRouter.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createArtifactSchema }),
  (req, res) => {
    const artifact = artifactsService.createArtifact(req.body, req.user!.id)
    res.status(201).json(artifact)
  },
)

artifactsRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: artifactIdParamSchema, body: updateArtifactSchema }),
  (req, res) => {
    res.json(artifactsService.updateArtifact(req.params.id, req.body))
  },
)

artifactsRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: artifactIdParamSchema }),
  (req, res) => {
    artifactsService.deleteArtifact(req.params.id)
    res.status(204).send()
  },
)

artifactsRouter.get(
  '/:artifactId/files',
  authenticate,
  validate({ params: artifactFileParamsSchema }),
  (req, res) => {
    res.json(filesService.listArtifactFiles(req.params.artifactId))
  },
)

artifactsRouter.post(
  '/:artifactId/files',
  authenticate,
  requireAdmin,
  validate({ params: artifactFileParamsSchema, body: createArtifactFileSchema }),
  (req, res) => {
    const file = filesService.createArtifactFile(req.params.artifactId, req.body, req.user!.id)
    res.status(201).json(file)
  },
)

artifactsRouter.delete(
  '/:artifactId/files/:fileId',
  authenticate,
  requireAdmin,
  validate({ params: artifactFileDeleteParamsSchema }),
  (req, res) => {
    filesService.deleteArtifactFile(req.params.artifactId, Number(req.params.fileId))
    res.status(204).send()
  },
)
