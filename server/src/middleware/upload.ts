import multer from 'multer'
import { AppError } from '../errors/AppError.js'
import {
  ensureInboxDir,
  getInboxDir,
  MAX_UPLOAD_BYTES,
  sanitizeFilename,
} from '../services/upload.service.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureInboxDir()
    cb(null, getInboxDir())
  },
  filename: (_req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname)
    cb(null, `${Date.now()}-${safeName}`)
  },
})

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 20 },
})

export function handleUploadError(err: unknown): AppError | null {
  if (!(err instanceof multer.MulterError)) {
    return null
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError(400, 'VALIDATION_ERROR', 'File exceeds the 50 MB size limit')
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError(400, 'VALIDATION_ERROR', 'Too many files in one upload (max 20)')
  }

  return new AppError(400, 'VALIDATION_ERROR', err.message)
}
