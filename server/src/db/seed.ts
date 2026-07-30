import bcrypt from 'bcrypt'
import { getDb } from './connection.js'
import { runMigrations } from './migrate.js'

const folders = [
  { id: 'docs', label: 'docs/', color: 'var(--accent-string)', icon: 'D', sort_order: 1 },
  { id: 'tests', label: 'tests/', color: 'var(--accent-function)', icon: 'T', sort_order: 2 },
  { id: 'ops', label: 'ops/', color: 'var(--accent-keyword)', icon: 'O', sort_order: 3 },
  { id: 'tools', label: 'tools/', color: 'var(--accent-function)', icon: 'X', sort_order: 4 },
  { id: 'comms', label: 'comms/', color: 'var(--accent-string)', icon: 'C', sort_order: 5 },
]

const artifacts = [
  {
    id: 'brd',
    folder_id: 'docs',
    name: 'BRD',
    path: 'docs/BRD/',
    description: 'Scope, objectives, and success metrics for the 10-session program.',
    status: 'Final',
    color: 'var(--accent-string)',
  },
  {
    id: 'arch',
    folder_id: 'docs',
    name: 'Architecture',
    path: 'docs/architecture/',
    description:
      'Lab environment design, reference builds, and the RAG + MCP setup used in exercises.',
    status: 'Final',
    color: 'var(--accent-keyword)',
  },
  {
    id: 'inbox',
    folder_id: 'tools',
    name: 'Inbox',
    path: 'uploads/inbox/',
    description: 'Uploaded files awaiting automatic assignment to artifact folders.',
    status: 'Pending',
    color: 'var(--accent-function)',
  },
]

const users = [
  {
    email: 'admin@thoughtfocus.com',
    password: 'Admin1234',
    display_name: 'Admin User',
    role: 'admin' as const,
  },
  {
    email: 'dev@thoughtfocus.com',
    password: 'Dev12345',
    display_name: 'Dev User',
    role: 'member' as const,
  },
  {
    email: 'reviewer@thoughtfocus.com',
    password: 'Review123',
    display_name: 'Reviewer User',
    role: 'member' as const,
  },
]

const artifactFiles = [
  {
    artifact_id: 'brd',
    filename: 'brd-final.pdf',
    storage_path: 'uploads/docs/brd/brd-final.pdf',
    mime_type: 'application/pdf',
    size_bytes: 245760,
  },
  {
    artifact_id: 'brd',
    filename: 'scope-summary.docx',
    storage_path: 'uploads/docs/brd/scope-summary.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size_bytes: 98304,
  },
  {
    artifact_id: 'arch',
    filename: 'architecture-diagram.png',
    storage_path: 'uploads/docs/arch/architecture-diagram.png',
    mime_type: 'image/png',
    size_bytes: 512000,
  },
]

export function seedDatabase(): void {
  runMigrations()
  const db = getDb()

  const insertFolder = db.prepare(`
    INSERT OR IGNORE INTO folders (id, label, color, icon, sort_order)
    VALUES (@id, @label, @color, @icon, @sort_order)
  `)

  for (const folder of folders) {
    insertFolder.run(folder)
  }

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, password_hash, display_name, role)
    VALUES (@email, @password_hash, @display_name, @role)
  `)

  for (const user of users) {
    insertUser.run({
      email: user.email,
      password_hash: bcrypt.hashSync(user.password, 10),
      display_name: user.display_name,
      role: user.role,
    })
  }

  const admin = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('admin@thoughtfocus.com') as { id: number } | undefined

  const insertArtifact = db.prepare(`
    INSERT OR IGNORE INTO artifacts (id, folder_id, name, path, description, status, color, created_by)
    VALUES (@id, @folder_id, @name, @path, @description, @status, @color, @created_by)
  `)

  for (const artifact of artifacts) {
    insertArtifact.run({ ...artifact, created_by: admin?.id ?? null })
  }

  const insertFile = db.prepare(`
    INSERT OR IGNORE INTO artifact_files (artifact_id, filename, storage_path, mime_type, size_bytes, uploaded_by)
    VALUES (@artifact_id, @filename, @storage_path, @mime_type, @size_bytes, @uploaded_by)
  `)

  for (const file of artifactFiles) {
    insertFile.run({ ...file, uploaded_by: admin?.id ?? null })
  }
}

import { pathToFileURL } from 'node:url'

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  seedDatabase()
  console.log('Database seeded successfully.')
}
