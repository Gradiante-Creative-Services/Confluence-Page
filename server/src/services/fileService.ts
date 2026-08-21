import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { forbidden, HttpError, notFound } from '../errors.ts'
import { can } from '../permissions.ts'
import type { ArtifactRepository } from '../repositories/artifactRepository.ts'
import type { FileRepository } from '../repositories/fileRepository.ts'
import type { FileRecord, FileSummary, PublicUser } from '../types.ts'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set([
  '.md',
  '.txt',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.json',
  '.yml',
  '.yaml',
  '.html',
  '.zip',
])

export function isAllowedExtension(filename: string): boolean {
  return ALLOWED_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

function toSummary(file: FileRecord): FileSummary {
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

function storedPath(uploadDir: string, artifactId: string, storedName: string): string {
  return path.join(uploadDir, artifactId, storedName)
}

export function createFileService(
  artifacts: ArtifactRepository,
  files: FileRepository,
  uploadDir: string,
) {
  return {
    list(artifactId: string, page: number, perPage: number) {
      if (!artifacts.findById(artifactId)) throw notFound('Artifact', artifactId)
      const total = files.count(artifactId)
      const rows = files.list(artifactId, perPage, (page - 1) * perPage)
      return { data: rows.map(toSummary), total, page, perPage }
    },

    getById(artifactId: string, fileId: string): FileSummary {
      if (!artifacts.findById(artifactId)) throw notFound('Artifact', artifactId)
      const file = files.findById(artifactId, fileId)
      if (!file) throw notFound('File', fileId)
      return toSummary(file)
    },

    absolutePath(artifactId: string, fileId: string): { file: FileRecord; diskPath: string } {
      if (!artifacts.findById(artifactId)) throw notFound('Artifact', artifactId)
      const file = files.findById(artifactId, fileId)
      if (!file) throw notFound('File', fileId)
      const diskPath = storedPath(uploadDir, artifactId, file.storedName)
      if (!fs.existsSync(diskPath)) throw notFound('File', fileId)
      return { file, diskPath }
    },

    create(
      artifactId: string,
      actor: PublicUser,
      uploaded: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
    ): FileSummary {
      const artifact = artifacts.findById(artifactId)
      if (!artifact) throw notFound('Artifact', artifactId)
      if (!uploaded) {
        throw new HttpError(422, 'validation_error', 'A file field named "file" is required')
      }
      if (!isAllowedExtension(uploaded.originalname)) {
        throw new HttpError(422, 'validation_error', 'File type is not allowed')
      }
      if (uploaded.size > MAX_FILE_BYTES) {
        throw new HttpError(413, 'payload_too_large', 'File exceeds the 10 MB limit')
      }

      const extension = path.extname(uploaded.originalname).toLowerCase()
      const storedName = `${randomUUID()}${extension}`
      const originalName = path.basename(uploaded.originalname)
      const relativePath = `${artifact.path}${originalName}`
      const now = new Date().toISOString()
      const record: FileRecord = {
        id: randomUUID(),
        artifactId,
        originalName,
        storedName,
        mimeType: uploaded.mimetype || 'application/octet-stream',
        sizeBytes: uploaded.size,
        relativePath,
        uploadedBy: actor.id,
        createdAt: now,
      }

      const directory = path.join(uploadDir, artifactId)
      fs.mkdirSync(directory, { recursive: true })
      fs.writeFileSync(path.join(directory, storedName), uploaded.buffer)
      files.insert(record)
      return toSummary(record)
    },

    writeSeedFile(
      artifactId: string,
      originalName: string,
      contents: string,
      uploadedBy: string,
      mimeType = 'text/markdown',
    ): FileRecord {
      const artifact = artifacts.findById(artifactId)
      if (!artifact) throw notFound('Artifact', artifactId)
      const existing = files.findByOriginalName(artifactId, originalName)
      const extension = path.extname(originalName).toLowerCase() || '.md'
      const storedName = existing?.storedName ?? `${randomUUID()}${extension}`
      const directory = path.join(uploadDir, artifactId)
      fs.mkdirSync(directory, { recursive: true })
      fs.writeFileSync(path.join(directory, storedName), contents, 'utf8')

      if (existing) return existing

      const record: FileRecord = {
        id: randomUUID(),
        artifactId,
        originalName,
        storedName,
        mimeType,
        sizeBytes: Buffer.byteLength(contents),
        relativePath: `${artifact.path}${originalName}`,
        uploadedBy,
        createdAt: new Date().toISOString(),
      }
      files.insert(record)
      return record
    },

    delete(artifactId: string, fileId: string, actor: PublicUser): void {
      if (!artifacts.findById(artifactId)) throw notFound('Artifact', artifactId)
      const file = files.findById(artifactId, fileId)
      if (!file) throw notFound('File', fileId)
      const isOwner = file.uploadedBy === actor.id
      if (!isOwner && !can(actor.role, 'artifacts:manage')) {
        throw forbidden('You can only delete files you uploaded')
      }
      const diskPath = storedPath(uploadDir, artifactId, file.storedName)
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath)
      files.delete(artifactId, fileId)
    },

    deleteArtifactDirectory(artifactId: string): void {
      const directory = path.join(uploadDir, artifactId)
      fs.rmSync(directory, { recursive: true, force: true })
    },
  }
}

export type FileService = ReturnType<typeof createFileService>
