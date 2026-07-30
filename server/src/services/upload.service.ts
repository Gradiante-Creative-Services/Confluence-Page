import { mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Express } from 'express'
import { env } from '../config/env.js'
import { getDb } from '../db/connection.js'
import { AppError } from '../errors/AppError.js'
import { createArtifactFile } from './files.service.js'
import type { ArtifactFileItem } from './files.service.js'

export const INBOX_ARTIFACT_ID = 'inbox'
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export function getInboxDir(): string {
  return join(env.rootDir, 'uploads', 'inbox')
}

export function ensureInboxDir(): void {
  mkdirSync(getInboxDir(), { recursive: true })
}

export function sanitizeFilename(name: string): string {
  const base = basename(name).replace(/[^\w.\-() ]+/g, '_').trim()
  return base || 'upload'
}

function resolveUniqueFilename(artifactId: string, filename: string): string {
  const existing = getDb()
    .prepare('SELECT filename FROM artifact_files WHERE artifact_id = ? AND filename = ?')
    .get(artifactId, filename)

  if (!existing) {
    return filename
  }

  const dotIndex = filename.lastIndexOf('.')
  const stem = dotIndex > 0 ? filename.slice(0, dotIndex) : filename
  const ext = dotIndex > 0 ? filename.slice(dotIndex) : ''

  for (let attempt = 1; attempt <= 99; attempt += 1) {
    const candidate = `${stem} (${attempt})${ext}`
    const conflict = getDb()
      .prepare('SELECT filename FROM artifact_files WHERE artifact_id = ? AND filename = ?')
      .get(artifactId, candidate)

    if (!conflict) {
      return candidate
    }
  }

  throw new AppError(409, 'CONFLICT', 'Too many files with the same name')
}

export function storeUploadedFiles(
  files: Express.Multer.File[],
  uploadedBy: number,
): { files: ArtifactFileItem[]; total: number } {
  if (files.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'At least one file is required')
  }

  ensureInboxDir()
  const saved: ArtifactFileItem[] = []

  for (const file of files) {
    const displayName = resolveUniqueFilename(INBOX_ARTIFACT_ID, sanitizeFilename(file.originalname))
    const storagePath = join('uploads', 'inbox', file.filename).replace(/\\/g, '/')

    const record = createArtifactFile(
      INBOX_ARTIFACT_ID,
      {
        filename: displayName,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storagePath,
      },
      uploadedBy,
    )

    saved.push(record)
  }

  return { files: saved, total: saved.length }
}
