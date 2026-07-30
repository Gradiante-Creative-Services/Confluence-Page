import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { listFolders } from '../services/artifacts.service.js'

export const foldersRouter = Router()

foldersRouter.get('/', authenticate, (_req, res) => {
  res.json(listFolders())
})
