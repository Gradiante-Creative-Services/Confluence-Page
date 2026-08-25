import { apiGet } from './client'
import type { IngestJobStatus } from './types'

export function getIngestStatus(fileId: string): Promise<IngestJobStatus> {
  return apiGet<IngestJobStatus>(`/api/v1/rag/ingest/${fileId}/status`)
}
