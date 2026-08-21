import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { HttpError, notFound, type FieldDetail } from './errors.ts'

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
  folderCounts?: Record<string, number>
}

export interface PaginationLinks {
  self: string
  next: string | null
  last: string
}

export function sendData(
  res: Response,
  data: unknown,
  status = 200,
  extra?: { meta?: PaginationMeta; links?: PaginationLinks },
): void {
  res.status(status).json({
    data,
    ...(extra?.meta ? { meta: extra.meta } : {}),
    ...(extra?.links ? { links: extra.links } : {}),
  })
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: FieldDetail[],
): void {
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  })
}

export function routeParam(value: string | string[] | undefined): string {
  const resolved = Array.isArray(value) ? value[0] : value
  if (!resolved) throw notFound('Resource')
  return resolved
}

export function parsePage(query: Request['query']): { page: number; perPage: number; offset: number } {
  const pageValue = Number(typeof query.page === 'string' ? query.page : 1)
  const perPageValue = Number(typeof query.per_page === 'string' ? query.per_page : 20)
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1
  const perPageRaw = Number.isFinite(perPageValue) && perPageValue > 0 ? Math.floor(perPageValue) : 20
  const perPage = Math.min(100, perPageRaw)
  return { page, perPage, offset: (page - 1) * perPage }
}

export function buildLinks(
  pathname: string,
  page: number,
  perPage: number,
  total: number,
  query: Record<string, string | undefined>,
): PaginationLinks {
  const totalPages = Math.max(1, Math.ceil(total / perPage) || 1)
  const withPage = (value: number) => {
    const params = new URLSearchParams()
    for (const [key, item] of Object.entries(query)) {
      if (item) params.set(key, item)
    }
    params.set('page', String(value))
    params.set('per_page', String(perPage))
    return `${pathname}?${params.toString()}`
  }

  return {
    self: withPage(page),
    next: page < totalPages ? withPage(page + 1) : null,
    last: withPage(totalPages),
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof HttpError) {
    sendError(res, error.status, error.code, error.message, error.details)
    return
  }

  if (error instanceof ZodError) {
    const details: FieldDetail[] = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
      code: issue.code,
    }))
    sendError(res, 422, 'validation_error', 'Request validation failed', details)
    return
  }

  if (isMulterLimitError(error)) {
    sendError(res, 413, 'payload_too_large', 'File exceeds the 10 MB limit')
    return
  }

  if (isJsonSyntaxError(error)) {
    sendError(res, 400, 'invalid_json', 'Invalid JSON body')
    return
  }

  console.error('Unhandled error', error)
  sendError(res, 500, 'internal_error', 'Internal server error')
}

function isMulterLimitError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'LIMIT_FILE_SIZE',
  )
}

function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError && 'body' in error
}
