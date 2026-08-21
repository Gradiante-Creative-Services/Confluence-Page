import type { SqliteDatabase } from '../db/client.ts'
import type { FileRecord } from '../types.ts'

interface FileRow {
  id: string
  artifact_id: string
  original_name: string
  stored_name: string
  mime_type: string
  size_bytes: number
  relative_path: string
  uploaded_by: string
  created_at: string
}

function mapFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    originalName: row.original_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    relativePath: row.relative_path,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }
}

export function createFileRepository(db: SqliteDatabase) {
  const findByIdStmt = db.prepare(
    'SELECT * FROM artifact_files WHERE id = ? AND artifact_id = ?',
  )
  const listStmt = db.prepare(
    'SELECT * FROM artifact_files WHERE artifact_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
  )
  const countStmt = db.prepare(
    'SELECT COUNT(*) AS total FROM artifact_files WHERE artifact_id = ?',
  )
  const findByNameStmt = db.prepare(
    'SELECT * FROM artifact_files WHERE artifact_id = ? AND original_name = ?',
  )
  const insertStmt = db.prepare(`
    INSERT INTO artifact_files (
      id, artifact_id, original_name, stored_name, mime_type, size_bytes, relative_path, uploaded_by, created_at
    ) VALUES (
      @id, @artifact_id, @original_name, @stored_name, @mime_type, @size_bytes, @relative_path, @uploaded_by, @created_at
    )
  `)
  const deleteStmt = db.prepare('DELETE FROM artifact_files WHERE id = ? AND artifact_id = ?')

  return {
    findById(artifactId: string, fileId: string): FileRecord | null {
      const row = findByIdStmt.get(fileId, artifactId) as FileRow | undefined
      return row ? mapFile(row) : null
    },
    findByOriginalName(artifactId: string, originalName: string): FileRecord | null {
      const row = findByNameStmt.get(artifactId, originalName) as FileRow | undefined
      return row ? mapFile(row) : null
    },
    list(artifactId: string, limit: number, offset: number): FileRecord[] {
      return (listStmt.all(artifactId, limit, offset) as FileRow[]).map(mapFile)
    },
    count(artifactId: string): number {
      return (countStmt.get(artifactId) as { total: number }).total
    },
    insert(file: FileRecord): void {
      insertStmt.run({
        id: file.id,
        artifact_id: file.artifactId,
        original_name: file.originalName,
        stored_name: file.storedName,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
        relative_path: file.relativePath,
        uploaded_by: file.uploadedBy,
        created_at: file.createdAt,
      })
    },
    delete(artifactId: string, fileId: string): boolean {
      return deleteStmt.run(fileId, artifactId).changes > 0
    },
  }
}

export type FileRepository = ReturnType<typeof createFileRepository>
