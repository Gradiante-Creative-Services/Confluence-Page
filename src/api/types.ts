export type ArtifactFolder = 'docs' | 'tests' | 'ops' | 'tools' | 'comms'
export type ArtifactStatus = 'draft' | 'in_review' | 'final'

export interface ArtifactSummary {
  id: string
  slug: string
  name: string
  folder: ArtifactFolder
  path: string
  description: string
  status: ArtifactStatus
  fileCount: number
  createdAt: string
  updatedAt: string
}

export interface FileSummary {
  id: string
  artifactId: string
  originalName: string
  mimeType: string
  sizeBytes: number
  relativePath: string
  uploadedBy: string
  createdAt: string
}

export interface ArtifactDetail extends ArtifactSummary {
  createdBy: string
  updatedBy: string | null
  files: FileSummary[]
}

export interface ArtifactListResponse {
  data: ArtifactSummary[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
    folderCounts?: Record<string, number>
  }
}

export interface CreateArtifactInput {
  name: string
  folder: ArtifactFolder
  description: string
  status?: ArtifactStatus
}

export const FOLDER_COLORS: Record<ArtifactFolder, string> = {
  docs: 'var(--accent-string)',
  tests: 'var(--accent-function)',
  ops: 'var(--accent-keyword)',
  tools: 'var(--accent-function)',
  comms: 'var(--accent-string)',
}

export const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  final: 'Final',
}
