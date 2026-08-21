import { apiDownload, apiGet, apiGetEnvelope, apiSend, apiUpload } from './client'
import type {
  ArtifactDetail,
  ArtifactListResponse,
  CreateArtifactInput,
  FileSummary,
} from './types'

export async function listArtifacts(options: {
  folder?: string
  q?: string
  signal?: AbortSignal
}): Promise<ArtifactListResponse> {
  const params = new URLSearchParams()
  if (options.folder && options.folder !== 'all') params.set('folder', options.folder)
  if (options.q) params.set('q', options.q)
  params.set('per_page', '100')
  params.set('sort', '-updatedAt')
  const query = params.toString()
  return apiGetEnvelope<ArtifactListResponse>(`/api/v1/artifacts?${query}`, {
    signal: options.signal,
  })
}

export function getArtifact(id: string): Promise<ArtifactDetail> {
  return apiGet<ArtifactDetail>(`/api/v1/artifacts/${id}`)
}

export async function createArtifact(input: CreateArtifactInput): Promise<ArtifactDetail> {
  const result = await apiSend<ArtifactDetail>('/api/v1/artifacts', 'POST', input)
  return result.data
}

export function uploadArtifactFile(artifactId: string, file: File): Promise<FileSummary> {
  return apiUpload<FileSummary>(`/api/v1/artifacts/${artifactId}/files`, file)
}

export async function deleteArtifactFile(artifactId: string, fileId: string): Promise<void> {
  await apiSend(`/api/v1/artifacts/${artifactId}/files/${fileId}`, 'DELETE')
}

export async function downloadArtifactFile(
  artifactId: string,
  fileId: string,
  filename: string,
): Promise<void> {
  const blob = await apiDownload(`/api/v1/artifacts/${artifactId}/files/${fileId}/download`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function emptyFolderCounts(): Record<string, number> {
  return { all: 0, docs: 0, tests: 0, ops: 0, tools: 0, comms: 0 }
}
