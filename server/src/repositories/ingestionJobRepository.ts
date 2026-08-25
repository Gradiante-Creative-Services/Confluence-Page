import type { SqliteDatabase } from '../db/client.ts'

export type IngestionStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface IngestionJobRecord {
  fileId: string
  status: IngestionStatus
  chunkCount: number
  errorMessage: string | null
  updatedAt: string
}

interface JobRow {
  file_id: string
  status: IngestionStatus
  chunk_count: number
  error_message: string | null
  updated_at: string
}

function mapJob(row: JobRow): IngestionJobRecord {
  return {
    fileId: row.file_id,
    status: row.status,
    chunkCount: row.chunk_count,
    errorMessage: row.error_message,
    updatedAt: row.updated_at,
  }
}

export function createIngestionJobRepository(db: SqliteDatabase) {
  const findStmt = db.prepare('SELECT * FROM ingestion_jobs WHERE file_id = ?')
  const upsertStmt = db.prepare(`
    INSERT INTO ingestion_jobs (file_id, status, chunk_count, error_message, updated_at)
    VALUES (@file_id, @status, @chunk_count, @error_message, @updated_at)
    ON CONFLICT(file_id) DO UPDATE SET
      status = excluded.status,
      chunk_count = excluded.chunk_count,
      error_message = excluded.error_message,
      updated_at = excluded.updated_at
  `)

  return {
    findByFileId(fileId: string): IngestionJobRecord | null {
      const row = findStmt.get(fileId) as JobRow | undefined
      return row ? mapJob(row) : null
    },

    upsert(job: IngestionJobRecord): void {
      upsertStmt.run({
        file_id: job.fileId,
        status: job.status,
        chunk_count: job.chunkCount,
        error_message: job.errorMessage,
        updated_at: job.updatedAt,
      })
    },
  }
}

export type IngestionJobRepository = ReturnType<typeof createIngestionJobRepository>
