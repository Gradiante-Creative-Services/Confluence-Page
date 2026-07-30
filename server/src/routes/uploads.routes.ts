import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { handleUploadError, uploadMiddleware } from '../middleware/upload.js'
import { AppError } from '../errors/AppError.js'
import { storeUploadedFiles } from '../services/upload.service.js'

export const uploadsRouter = Router()

uploadsRouter.post('/', authenticate, (req, res, next) => {
  uploadMiddleware.array('files', 20)(req, res, (err) => {
    if (err) {
      const uploadError = handleUploadError(err)
      next(uploadError ?? err)
      return
    }

    try {
      const files = req.files as Express.Multer.File[] | undefined
      if (!files?.length) {
        next(new AppError(400, 'VALIDATION_ERROR', 'At least one file is required'))
        return
      }

      const result = storeUploadedFiles(files, req.user!.id)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  })
})
