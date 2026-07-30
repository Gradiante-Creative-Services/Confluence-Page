import { getDb } from '../db/connection.js'
import { AppError } from '../errors/AppError.js'
import type { ArtifactRow, FolderRow } from '../types/models.js'
import type { CreateArtifactInput, UpdateArtifactInput } from '../schemas/artifacts.schema.js'

export interface ArtifactListItem {
  id: string
  folderId: string
  name: string
  path: string
  description: string
  status: string
  color: string
  fileCount: number
  createdAt: string
  updatedAt: string
}

export interface ArtifactDetail extends Omit<ArtifactListItem, 'fileCount'> {
  files: Array<{
    id: number
    filename: string
    mimeType: string
    sizeBytes: number
    storagePath: string
    uploadedBy: number | null
    createdAt: string
  }>
}

function mapListItem(row: ArtifactRow & { file_count: number }): ArtifactListItem {
  return {
    id: row.id,
    folderId: row.folder_id,
    name: row.name,
    path: row.path,
    description: row.description,
    status: row.status,
    color: row.color,
    fileCount: row.file_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listFolders() {
  const rows = getDb()
    .prepare(
      `
      SELECT
        f.id,
        f.label,
        f.color,
        f.icon,
        f.sort_order AS sortOrder,
        COUNT(a.id) AS artifactCount
      FROM folders f
      LEFT JOIN artifacts a ON a.folder_id = f.id
      GROUP BY f.id
      ORDER BY f.sort_order ASC
    `,
    )
    .all() as Array<FolderRow & { sortOrder: number; artifactCount: number }>

  return { folders: rows }
}

export function listArtifacts(filters: {
  folder?: string
  search?: string
  status?: string
}) {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.folder) {
    conditions.push('a.folder_id = ?')
    params.push(filters.folder)
  }

  if (filters.status) {
    conditions.push('a.status = ?')
    params.push(filters.status)
  }

  if (filters.search) {
    conditions.push('(LOWER(a.name) LIKE ? OR LOWER(a.description) LIKE ?)')
    const term = `%${filters.search.toLowerCase()}%`
    params.push(term, term)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = getDb()
    .prepare(
      `
      SELECT
        a.*,
        COUNT(f.id) AS file_count
      FROM artifacts a
      LEFT JOIN artifact_files f ON f.artifact_id = a.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.name ASC
    `,
    )
    .all(...params) as Array<ArtifactRow & { file_count: number }>

  const artifacts = rows.map(mapListItem)
  return { artifacts, total: artifacts.length }
}

export function getArtifactById(id: string): ArtifactDetail {
  const row = getDb()
    .prepare('SELECT * FROM artifacts WHERE id = ?')
    .get(id) as ArtifactRow | undefined

  if (!row) {
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
        storage_path AS storagePath,
        uploaded_by AS uploadedBy,
        created_at AS createdAt
      FROM artifact_files
      WHERE artifact_id = ?
      ORDER BY filename ASC
    `,
    )
    .all(id) as ArtifactDetail['files']

  return {
    id: row.id,
    folderId: row.folder_id,
    name: row.name,
    path: row.path,
    description: row.description,
    status: row.status,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    files,
  }
}

export function createArtifact(input: CreateArtifactInput, createdBy: number): ArtifactListItem {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM artifacts WHERE id = ?').get(input.id)
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Artifact with this id already exists')
  }

  const now = new Date().toISOString()

  db.prepare(
    `
    INSERT INTO artifacts (id, folder_id, name, path, description, status, color, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    input.id,
    input.folderId,
    input.name,
    input.path,
    input.description,
    input.status,
    input.color,
    createdBy,
    now,
    now,
  )

  return {
    id: input.id,
    folderId: input.folderId,
    name: input.name,
    path: input.path,
    description: input.description,
    status: input.status,
    color: input.color,
    fileCount: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateArtifact(id: string, input: UpdateArtifactInput): ArtifactListItem {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as ArtifactRow | undefined

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Artifact not found')
  }

  const next = {
    folder_id: input.folderId ?? existing.folder_id,
    name: input.name ?? existing.name,
    path: input.path ?? existing.path,
    description: input.description ?? existing.description,
    status: input.status ?? existing.status,
    color: input.color ?? existing.color,
    updated_at: new Date().toISOString(),
  }

  db.prepare(
    `
    UPDATE artifacts
    SET folder_id = ?, name = ?, path = ?, description = ?, status = ?, color = ?, updated_at = ?
    WHERE id = ?
  `,
  ).run(
    next.folder_id,
    next.name,
    next.path,
    next.description,
    next.status,
    next.color,
    next.updated_at,
    id,
  )

  const fileCount = db
    .prepare('SELECT COUNT(*) AS count FROM artifact_files WHERE artifact_id = ?')
    .get(id) as { count: number }

  return {
    id,
    folderId: next.folder_id,
    name: next.name,
    path: next.path,
    description: next.description,
    status: next.status,
    color: next.color,
    fileCount: fileCount.count,
    createdAt: existing.created_at,
    updatedAt: next.updated_at,
  }
}

export function deleteArtifact(id: string): void {
  const result = getDb().prepare('DELETE FROM artifacts WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Artifact not found')
  }
}

export function artifactExists(id: string): boolean {
  const row = getDb().prepare('SELECT id FROM artifacts WHERE id = ?').get(id)
  return Boolean(row)
}
