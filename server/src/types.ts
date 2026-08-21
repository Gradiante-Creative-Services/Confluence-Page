import type { Permission, Role } from './permissions.ts'

export interface PublicUser {
  id: string
  email: string
  role: Role
  displayName: string
}

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  displayName: string
  role: Role
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export interface ArtifactFolderCounts {
  all: number
  docs: number
  tests: number
  ops: number
  tools: number
  comms: number
}

export type ArtifactFolder = 'docs' | 'tests' | 'ops' | 'tools' | 'comms'
export type ArtifactStatus = 'draft' | 'in_review' | 'final'

export interface ArtifactRecord {
  id: string
  slug: string
  name: string
  folder: ArtifactFolder
  path: string
  description: string
  status: ArtifactStatus
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

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

export interface FileRecord {
  id: string
  artifactId: string
  originalName: string
  storedName: string
  mimeType: string
  sizeBytes: number
  relativePath: string
  uploadedBy: string
  createdAt: string
}

export interface LoginResponse {
  user: PublicUser
  token: string
  permissions: Permission[]
}

export interface ArtifactListQuery {
  folder?: ArtifactFolder
  status?: ArtifactStatus
  q?: string
  page: number
  perPage: number
  sort: string
}
