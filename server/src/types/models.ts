export type UserRole = 'member' | 'admin'

export interface UserRow {
  id: number
  email: string
  password_hash: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface FolderRow {
  id: string
  label: string
  color: string
  icon: string
  sort_order: number
}

export interface ArtifactRow {
  id: string
  folder_id: string
  name: string
  path: string
  description: string
  status: string
  color: string
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface ArtifactFileRow {
  id: number
  artifact_id: string
  filename: string
  storage_path: string
  mime_type: string
  size_bytes: number
  uploaded_by: number | null
  created_at: string
}

export interface JwtPayload {
  sub: number
  email: string
  role: UserRole
}
