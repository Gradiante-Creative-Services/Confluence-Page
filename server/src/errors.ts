export interface FieldDetail {
  field: string
  message: string
  code: string
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: FieldDetail[],
  ) {
    super(message)
    this.name = 'HttpError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function unauthorized(message = 'Authentication required'): HttpError {
  return new HttpError(401, 'unauthorized', message)
}

export function forbidden(message = 'Insufficient permissions'): HttpError {
  return new HttpError(403, 'forbidden', message)
}

export function notFound(resource: string, id?: string): HttpError {
  const message = id ? `${resource} not found: ${id}` : `${resource} not found`
  return new HttpError(404, 'not_found', message)
}

export function conflict(message: string): HttpError {
  return new HttpError(409, 'conflict', message)
}
