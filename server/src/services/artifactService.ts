import { randomUUID } from 'node:crypto'
import { conflict, HttpError, notFound } from '../errors.ts'
import type { ArtifactRepository } from '../repositories/artifactRepository.ts'
import type { FileRepository } from '../repositories/fileRepository.ts'
import type {
  ArtifactDetail,
  ArtifactListQuery,
  ArtifactRecord,
  ArtifactSummary,
  FileSummary,
  PublicUser,
} from '../types.ts'
import {
  createArtifactSchema,
  defaultArtifactPath,
  listArtifactQuerySchema,
  slugify,
  updateArtifactSchema,
} from '../validation/artifacts.ts'

function isUniqueError(error: unknown, column: string): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      String((error as { code: string }).code).includes('CONSTRAINT') &&
      String(error).includes(column),
  )
}

function toSummary(artifact: ArtifactRecord, fileCount: number): ArtifactSummary {
  return {
    id: artifact.id,
    slug: artifact.slug,
    name: artifact.name,
    folder: artifact.folder,
    path: artifact.path,
    description: artifact.description,
    status: artifact.status,
    fileCount,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  }
}

function toFileSummary(file: {
  id: string
  artifactId: string
  originalName: string
  mimeType: string
  sizeBytes: number
  relativePath: string
  uploadedBy: string
  createdAt: string
}): FileSummary {
  return {
    id: file.id,
    artifactId: file.artifactId,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    relativePath: file.relativePath,
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt,
  }
}

export function createArtifactService(
  artifacts: ArtifactRepository,
  files: FileRepository,
) {
  return {
    list(rawQuery: Record<string, unknown>) {
      const parsed = listArtifactQuerySchema.parse({
        folder: emptyToUndefined(rawQuery.folder),
        status: emptyToUndefined(rawQuery.status),
        q: emptyToUndefined(rawQuery.q),
        sort: emptyToUndefined(rawQuery.sort),
      })
      const page = Math.max(1, Number(rawQuery.page) || 1)
      const perPage = Math.min(100, Math.max(1, Number(rawQuery.per_page) || 20))
      const query: ArtifactListQuery = {
        folder: parsed.folder,
        status: parsed.status,
        q: parsed.q?.trim() || undefined,
        page,
        perPage,
        sort: parsed.sort ?? '-updatedAt',
      }
      const { rows, total } = artifacts.list(query)
      const folderCounts = artifacts.folderCounts({ status: query.status, q: query.q })
      return {
        data: rows.map((row) => toSummary(row, artifacts.fileCount(row.id))),
        total,
        page,
        perPage,
        folderCounts,
      }
    },

    getById(id: string): ArtifactDetail {
      const artifact = artifacts.findById(id)
      if (!artifact) throw notFound('Artifact', id)
      const fileRows = files.list(id, 100, 0)
      return {
        ...toSummary(artifact, fileRows.length),
        createdBy: artifact.createdBy,
        updatedBy: artifact.updatedBy,
        files: fileRows.map(toFileSummary),
      }
    },

    create(body: unknown, actor: PublicUser): ArtifactRecord {
      const input = createArtifactSchema.parse(body)
      const now = new Date().toISOString()
      let slug: string
      try {
        slug = input.slug ?? slugify(input.name)
      } catch {
        throw new HttpError(422, 'validation_error', 'Unable to derive a slug from name')
      }
      const artifact: ArtifactRecord = {
        id: randomUUID(),
        slug,
        name: input.name,
        folder: input.folder,
        path: input.path ?? defaultArtifactPath(input.folder, slug),
        description: input.description,
        status: input.status ?? 'draft',
        createdBy: actor.id,
        updatedBy: actor.id,
        createdAt: now,
        updatedAt: now,
      }
      try {
        artifacts.insert(artifact)
      } catch (error) {
        if (isUniqueError(error, 'slug')) throw conflict('An artifact with this slug already exists')
        if (isUniqueError(error, 'path')) throw conflict('An artifact with this path already exists')
        throw error
      }
      return artifact
    },

    update(id: string, body: unknown, actor: PublicUser): ArtifactRecord {
      const current = artifacts.findById(id)
      if (!current) throw notFound('Artifact', id)
      const input = updateArtifactSchema.parse(body)
      const now = new Date().toISOString()
      try {
        artifacts.update(id, {
          ...input,
          updatedAt: now,
          updatedBy: actor.id,
        })
      } catch (error) {
        if (isUniqueError(error, 'slug')) throw conflict('An artifact with this slug already exists')
        if (isUniqueError(error, 'path')) throw conflict('An artifact with this path already exists')
        throw error
      }
      const updated = artifacts.findById(id)
      if (!updated) throw notFound('Artifact', id)
      return updated
    },

    delete(id: string): ArtifactRecord {
      const current = artifacts.findById(id)
      if (!current) throw notFound('Artifact', id)
      artifacts.delete(id)
      return current
    },
  }
}

function emptyToUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export type ArtifactService = ReturnType<typeof createArtifactService>
