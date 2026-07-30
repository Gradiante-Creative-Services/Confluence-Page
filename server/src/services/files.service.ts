import { getDb } from '../db/connection.js'
import { AppError } from '../errors/AppError.js'
import { artifactExists } from './artifacts.service.js'
import type { CreateArtifactFileInput } from '../schemas/files.schema.js'

export interface ArtifactFileItem {
  id: number
  filename: string
  mimeType: string
  sizeBytes: number
  storagePath?: string
  uploadedBy?: number | null
  createdAt: string
}

export function listArtifactFiles(artifactId: string) {
  if (!artifactExists(artifactId)) {
    throw new AppError(404, 'NOT_FOUND', 'Artifact not found')
  }

  const files = getDb()
    .prepare(
      `
      SELECT
        id,
        filename,
        mime_type AS mimeType,
        size_bytes AS sizeBytes,
        created_at AS createdAt
      FROM artifact_files
      WHERE artifact_id = ?
      ORDER BY filename ASC
    `,
    )
    .all(artifactId) as Array<Omit<ArtifactFileItem, 'storagePath' | 'uploadedBy'>>

  return { files, total: files.length }
}

export function createArtifactFile(
  artifactId: string,
  input: CreateArtifactFileInput,
  uploadedBy: number,
): ArtifactFileItem {
  if (!artifactExists(artifactId)) {
    throw new AppError(404, 'NOT_FOUND', 'Artifact not found')
  }

  const existing = getDb()
    .prepare('SELECT id FROM artifact_files WHERE artifact_id = ? AND filename = ?')
    .get(artifactId, input.filename)

  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A file with this filename already exists for the artifact')
  }

  const result = getDb()
    .prepare(
      `
      INSERT INTO artifact_files (artifact_id, filename, storage_path, mime_type, size_bytes, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      artifactId,
      input.filename,
      input.storagePath,
      input.mimeType,
      input.sizeBytes,
      uploadedBy,
    )

  const row = getDb()
    .prepare(
      `
      SELECT
        id,
        filename,
        mime_type AS mimeType,
        size_bytes AS sizeBytes,
        storage_path AS storagePath,
        uploaded_by AS uploadedBy,
        created_at AS createdAt
      FROM artifact_files
      WHERE id = ?
    `,
    )
    .get(result.lastInsertRowid) as ArtifactFileItem

  return row
}

export function deleteArtifactFile(artifactId: string, fileId: number): void {
  const result = getDb()
    .prepare('DELETE FROM artifact_files WHERE artifact_id = ? AND id = ?')
    .run(artifactId, fileId)

  if (result.changes === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Artifact file not found')
  }
}
