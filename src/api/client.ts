const TOKEN_KEY = 'tf-auth-token'

export class ApiError extends Error {
  status: number
  code: string
  details?: Array<{ field: string; message: string }>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...init, headers })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json()

  if (!response.ok) {
    const error = payload.error ?? {}
    throw new ApiError(
      response.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? 'Request failed',
      error.details,
    )
  }

  return payload as T
}

export interface AuthUser {
  id: number
  email: string
  displayName: string | null
  role: 'member' | 'admin'
}

export interface LoginResponse {
  token: string
  expiresIn: number
  user: AuthUser
}

export interface ApiArtifact {
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

export interface ArtifactsResponse {
  artifacts: ApiArtifact[]
  total: number
}

export interface FoldersResponse {
  folders: Array<{
    id: string
    label: string
    color: string
    icon: string
    sortOrder: number
    artifactCount: number
  }>
}

export function loginRequest(email: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function signupRequest(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string,
) {
  return apiFetch<LoginResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password, confirmPassword }),
  })
}

export function meRequest() {
  return apiFetch<{ user: AuthUser | null }>('/api/auth/me')
}

export function fetchArtifacts(params?: { folder?: string; search?: string; status?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.folder) searchParams.set('folder', params.folder)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()
  return apiFetch<ArtifactsResponse>(`/api/artifacts${query ? `?${query}` : ''}`)
}

export function fetchFolders() {
  return apiFetch<FoldersResponse>('/api/folders')
}

export interface UploadedFile {
  id: number
  filename: string
  mimeType: string
  sizeBytes: number
  storagePath?: string
  uploadedBy?: number | null
  createdAt: string
}

export interface UploadResponse {
  files: UploadedFile[]
  total: number
}

export async function uploadArtifactFiles(files: File[]): Promise<UploadResponse> {
  const token = getAuthToken()
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file)
  }

  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers,
    body: formData,
  })

  const payload = await response.json()

  if (!response.ok) {
    const error = payload.error ?? {}
    throw new ApiError(
      response.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? 'Upload failed',
      error.details,
    )
  }

  return payload as UploadResponse
}
