import type { SqliteDatabase } from '../db/client.ts'

export interface DocumentChunkRecord {
  id: number
  fileId: string
  artifactId: string
  filename: string
  chunkIndex: number
  content: string
  embedding: number[]
}

interface ChunkRow {
  id: number
  file_id: string
  artifact_id: string
  filename: string
  chunk_index: number
  content: string
  embedding: string
}

function mapChunk(row: ChunkRow): DocumentChunkRecord {
  return {
    id: row.id,
    fileId: row.file_id,
    artifactId: row.artifact_id,
    filename: row.filename,
    chunkIndex: row.chunk_index,
    content: row.content,
    embedding: JSON.parse(row.embedding) as number[],
  }
}

export interface NewDocumentChunk {
  fileId: string
  artifactId: string
  filename: string
  chunkIndex: number
  content: string
  embedding: number[]
}

export function createChunkRepository(db: SqliteDatabase) {
  const deleteByFileStmt = db.prepare('DELETE FROM document_chunks WHERE file_id = ?')
  const insertStmt = db.prepare(`
    INSERT INTO document_chunks (
      file_id, artifact_id, filename, chunk_index, content, embedding
    ) VALUES (
      @file_id, @artifact_id, @filename, @chunk_index, @content, @embedding
    )
  `)
  const listAllStmt = db.prepare('SELECT * FROM document_chunks')
  const listByArtifactsStmt = db.prepare(
    'SELECT * FROM document_chunks WHERE artifact_id IN (SELECT value FROM json_each(?))',
  )

  const replaceForFile = db.transaction((fileId: string, chunks: NewDocumentChunk[]) => {
    deleteByFileStmt.run(fileId)
    for (const chunk of chunks) {
      insertStmt.run({
        file_id: chunk.fileId,
        artifact_id: chunk.artifactId,
        filename: chunk.filename,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        embedding: JSON.stringify(chunk.embedding),
      })
    }
  })

  return {
    deleteByFileId(fileId: string): void {
      deleteByFileStmt.run(fileId)
    },

    replaceForFile(fileId: string, chunks: NewDocumentChunk[]): void {
      replaceForFile(fileId, chunks)
    },

    listAll(): DocumentChunkRecord[] {
      return (listAllStmt.all() as ChunkRow[]).map(mapChunk)
    },

    listByArtifactIds(artifactIds: string[]): DocumentChunkRecord[] {
      if (artifactIds.length === 0) return []
      return (listByArtifactsStmt.all(JSON.stringify(artifactIds)) as ChunkRow[]).map(mapChunk)
    },
  }
}

export type ChunkRepository = ReturnType<typeof createChunkRepository>
