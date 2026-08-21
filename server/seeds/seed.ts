import bcrypt from 'bcryptjs'
import { loadConfig } from '../src/config.ts'
import { openDatabase, type SqliteDatabase } from '../src/db/client.ts'
import { migrate } from '../src/db/migrate.ts'
import { createArtifactRepository } from '../src/repositories/artifactRepository.ts'
import { createFileRepository } from '../src/repositories/fileRepository.ts'
import { createUserRepository } from '../src/repositories/userRepository.ts'
import { createFileService } from '../src/services/fileService.ts'

export const SEED_ADMIN_ID = '11111111-1111-1111-1111-111111111111'
export const SEED_MEMBER_ID = '22222222-2222-2222-2222-222222222222'
export const SEED_BRD_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
export const SEED_ARCH_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

const ADMIN_PASSWORD_HASH = bcrypt.hashSync('Admin123!', 6) // demo admin password
const MEMBER_PASSWORD_HASH = bcrypt.hashSync('Member123!', 6) // demo member password

const BRD_MARKDOWN = `# BRD

Scope, objectives, and success metrics for the 10-session AI for Developers program.
`

const ARCH_MARKDOWN = `# Architecture

Lab environment design, reference builds, and the RAG + MCP setup used in exercises.
`

export function seedDatabase(db: SqliteDatabase, uploadDir: string): void {
  const now = new Date().toISOString()
  const users = createUserRepository(db)
  const artifacts = createArtifactRepository(db)
  const files = createFileRepository(db)
  const fileService = createFileService(artifacts, files, uploadDir)

  users.upsertByEmail({
    id: SEED_ADMIN_ID,
    email: 'admin@thoughtfocus.com',
    passwordHash: ADMIN_PASSWORD_HASH,
    displayName: 'Program Admin',
    role: 'admin',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  })

  users.upsertByEmail({
    id: SEED_MEMBER_ID,
    email: 'member@thoughtfocus.com',
    passwordHash: MEMBER_PASSWORD_HASH,
    displayName: 'Cohort Member',
    role: 'member',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  })

  artifacts.upsertBySlug({
    id: SEED_BRD_ID,
    slug: 'brd',
    name: 'BRD',
    folder: 'docs',
    path: 'docs/BRD/',
    description: 'Scope, objectives, and success metrics for the 10-session program.',
    status: 'final',
    createdBy: SEED_ADMIN_ID,
    updatedBy: SEED_ADMIN_ID,
    createdAt: now,
    updatedAt: now,
  })

  artifacts.upsertBySlug({
    id: SEED_ARCH_ID,
    slug: 'architecture',
    name: 'Architecture',
    folder: 'docs',
    path: 'docs/architecture/',
    description:
      'Lab environment design, reference builds, and the RAG + MCP setup used in exercises.',
    status: 'final',
    createdBy: SEED_ADMIN_ID,
    updatedBy: SEED_ADMIN_ID,
    createdAt: now,
    updatedAt: now,
  })

  fileService.writeSeedFile(SEED_BRD_ID, 'scope.md', BRD_MARKDOWN, SEED_ADMIN_ID)
  fileService.writeSeedFile(SEED_ARCH_ID, 'overview.md', ARCH_MARKDOWN, SEED_ADMIN_ID)
}

export function runSeedCli(): void {
  const config = loadConfig()
  const db = openDatabase(config.databasePath)
  migrate(db)
  seedDatabase(db, config.uploadDir)
  db.close()
  console.log('Seed complete')
}
