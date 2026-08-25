import fs from 'node:fs'
import path from 'node:path'
import { notFound } from '../errors.ts'
import type { ChunkRepository } from '../repositories/chunkRepository.ts'
import type {
  IngestionJobRecord,
  IngestionJobRepository,
} from '../repositories/ingestionJobRepository.ts'
import type { FileRepository } from '../repositories/fileRepository.ts'
import { chunkText } from './chunker.ts'
import { extractDocumentText, isIngestableExtension } from './documentExtract.ts'
import type { GeminiClient } from './geminiClient.ts'

export interface IngestStatusView {
  status: IngestionJobRecord['status']
  chunkCount: number
  errorMessage?: string
}

function toStatusView(job: IngestionJobRecord): IngestStatusView {
  return {
    status: job.status,
    chunkCount: job.chunkCount,
    ...(job.errorMessage ? { errorMessage: job.errorMessage } : {}),
  }
}

export function createIngestionService(
  files: FileRepository,
  jobs: IngestionJobRepository,
  chunks: ChunkRepository,
  gemini: GeminiClient,
  uploadDir: string,
) {
  const inFlight = new Set<string>()

  function diskPath(artifactId: string, storedName: string): string {
    return path.join(uploadDir, artifactId, storedName)
  }

  function mark(
    fileId: string,
    status: IngestionJobRecord['status'],
    chunkCount = 0,
    errorMessage: string | null = null,
  ): IngestionJobRecord {
    const job: IngestionJobRecord = {
      fileId,
      status,
      chunkCount,
      errorMessage,
      updatedAt: new Date().toISOString(),
    }
    jobs.upsert(job)
    return job
  }

  async function processJob(fileId: string): Promise<void> {
    if (inFlight.has(fileId)) return
    inFlight.add(fileId)

    try {
      mark(fileId, 'processing')

      const file = files.findByPrimaryKey(fileId)
      if (!file) {
        mark(fileId, 'failed', 0, 'File not found')
        return
      }

      if (!isIngestableExtension(file.originalName)) {
        mark(
          fileId,
          'failed',
          0,
          `Unsupported document type for ingestion: ${path.extname(file.originalName).toLowerCase() || '(none)'}`,
        )
        return
      }

      const absolute = diskPath(file.artifactId, file.storedName)
      if (!fs.existsSync(absolute)) {
        mark(fileId, 'failed', 0, 'File missing on disk')
        return
      }

      const buffer = fs.readFileSync(absolute)
      const text = await extractDocumentText(file.originalName, buffer)
      const pieces = chunkText(text)
      if (pieces.length === 0) {
        chunks.replaceForFile(fileId, [])
        mark(fileId, 'done', 0)
        return
      }

      const embeddings = await gemini.embedTexts(pieces)
      chunks.replaceForFile(
        fileId,
        pieces.map((content, chunkIndex) => ({
          fileId,
          artifactId: file.artifactId,
          filename: file.originalName,
          chunkIndex,
          content,
          embedding: embeddings[chunkIndex] ?? [],
        })),
      )
      mark(fileId, 'done', pieces.length)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ingestion failed'
      mark(fileId, 'failed', 0, message)
    } finally {
      inFlight.delete(fileId)
    }
  }

  function schedule(fileId: string): void {
    setImmediate(() => {
      void processJob(fileId)
    })
  }

  return {
    isIngestable: isIngestableExtension,

    enqueue(fileId: string): IngestStatusView {
      const file = files.findByPrimaryKey(fileId)
      if (!file) throw notFound('File', fileId)

      const job = mark(fileId, 'pending')
      schedule(fileId)
      return toStatusView(job)
    },

    /** Fire-and-forget after upload; skips unsupported types with no job row. */
    enqueueAfterUpload(fileId: string, filename: string): void {
      if (!isIngestableExtension(filename)) return
      try {
        const file = files.findByPrimaryKey(fileId)
        if (!file) return
        mark(fileId, 'pending')
        schedule(fileId)
      } catch {
        // Upload already succeeded; do not fail the response.
      }
    },

    getStatus(fileId: string): IngestStatusView {
      const file = files.findByPrimaryKey(fileId)
      if (!file) throw notFound('File', fileId)

      const job = jobs.findByFileId(fileId)
      if (!job) throw notFound('Ingestion job', fileId)
      return toStatusView(job)
    },

    /** Index existing files that never got a successful ingest (e.g. pre-RAG seeds). */
    backfillPending(): number {
      let queued = 0
      for (const file of files.listAll()) {
        if (!isIngestableExtension(file.originalName)) continue
        const job = jobs.findByFileId(file.id)
        if (job?.status === 'done' || job?.status === 'processing') continue
        mark(file.id, 'pending')
        schedule(file.id)
        queued += 1
      }
      return queued
    },
  }
}

export type IngestionService = ReturnType<typeof createIngestionService>
