import { loadSession } from '../auth/session'
import type { FieldErrors } from '../auth/types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Array<{ field: string; message: string; code: string }>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ field: string; message: string; code: string }>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  toFieldErrors(): FieldErrors {
    const errors: FieldErrors = {}
    for (const detail of this.details ?? []) {
      if (detail.field === 'email' || detail.field === 'password') {
        errors[detail.field] = detail.message
      }
    }
    return errors
  }
}

interface ErrorBody {
  error?: {
    code?: string
    message?: string
    details?: Array<{ field: string; message: string; code: string }>
  }
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const token = loadSession()?.token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

async function readBody(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}))
}

function throwIfFailed(response: Response, body: unknown): void {
  if (response.ok) return
  const errorBody = body as ErrorBody
  throw new ApiError(
    response.status,
    errorBody.error?.code ?? 'request_failed',
    errorBody.error?.message ?? 'Request failed',
    errorBody.error?.details,
  )
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: authHeaders(init?.headers),
  })
  const body = await readBody(response)
  throwIfFailed(response, body)
  return (body as { data: T }).data
}

export async function apiGetEnvelope<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: authHeaders(init?.headers),
  })
  const body = await readBody(response)
  throwIfFailed(response, body)
  return body as T
}

export async function apiSend<T>(
  path: string,
  method: string,
  payload?: unknown,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const headers = authHeaders(init?.headers)
  if (payload !== undefined) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, {
    ...init,
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  if (response.status === 204) {
    return { data: undefined as T, status: 204 }
  }
  const body = await readBody(response)
  throwIfFailed(response, body)
  return { data: (body as { data: T }).data, status: response.status }
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(path, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const body = await readBody(response)
  throwIfFailed(response, body)
  return (body as { data: T }).data
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await fetch(path, { headers: authHeaders() })
  if (!response.ok) {
    const body = await readBody(response)
    throwIfFailed(response, body)
  }
  return response.blob()
}
