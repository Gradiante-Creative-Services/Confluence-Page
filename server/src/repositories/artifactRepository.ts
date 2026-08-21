import type { SqliteDatabase } from '../db/client.ts'
import type {
  ArtifactFolder,
  ArtifactListQuery,
  ArtifactRecord,
  ArtifactStatus,
} from '../types.ts'

interface ArtifactRow {
  id: string
  slug: string
  name: string
  folder: ArtifactFolder
  path: string
  description: string
  status: ArtifactStatus
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

const SORT_COLUMNS: Record<string, string> = {
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  name: 'name',
  slug: 'slug',
}

function mapArtifact(row: ArtifactRow): ArtifactRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    folder: row.folder,
    path: row.path,
    description: row.description,
    status: row.status,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function parseSort(sort: string): { column: string; direction: 'ASC' | 'DESC' } {
  const descending = sort.startsWith('-')
  const key = descending ? sort.slice(1) : sort
  const column = SORT_COLUMNS[key] ?? 'updated_at'
  return { column, direction: descending || !SORT_COLUMNS[key] ? 'DESC' : 'ASC' }
}

export function createArtifactRepository(db: SqliteDatabase) {
  const findByIdStmt = db.prepare('SELECT * FROM artifacts WHERE id = ?')
  const findBySlugStmt = db.prepare('SELECT * FROM artifacts WHERE slug = ?')
  const insertStmt = db.prepare(`
    INSERT INTO artifacts (
      id, slug, name, folder, path, description, status, created_by, updated_by, created_at, updated_at
    ) VALUES (
      @id, @slug, @name, @folder, @path, @description, @status, @created_by, @updated_by, @created_at, @updated_at
    )
  `)
  const upsertBySlugStmt = db.prepare(`
    INSERT INTO artifacts (
      id, slug, name, folder, path, description, status, created_by, updated_by, created_at, updated_at
    ) VALUES (
      @id, @slug, @name, @folder, @path, @description, @status, @created_by, @updated_by, @created_at, @updated_at
    )
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      folder = excluded.folder,
      path = excluded.path,
      description = excluded.description,
      status = excluded.status,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `)
  const deleteStmt = db.prepare('DELETE FROM artifacts WHERE id = ?')
  const fileCountStmt = db.prepare(
    'SELECT COUNT(*) AS total FROM artifact_files WHERE artifact_id = ?',
  )

  function buildFilters(query: Pick<ArtifactListQuery, 'folder' | 'status' | 'q'>) {
    const clauses: string[] = []
    const params: unknown[] = []

    if (query.folder) {
      clauses.push('folder = ?')
      params.push(query.folder)
    }
    if (query.status) {
      clauses.push('status = ?')
      params.push(query.status)
    }
    if (query.q) {
      clauses.push('(name LIKE ? OR description LIKE ?)')
      const like = `%${query.q}%`
      params.push(like, like)
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
    return { where, params }
  }

  return {
    findById(id: string): ArtifactRecord | null {
      const row = findByIdStmt.get(id) as ArtifactRow | undefined
      return row ? mapArtifact(row) : null
    },
    findBySlug(slug: string): ArtifactRecord | null {
      const row = findBySlugStmt.get(slug) as ArtifactRow | undefined
      return row ? mapArtifact(row) : null
    },
    fileCount(artifactId: string): number {
      return (fileCountStmt.get(artifactId) as { total: number }).total
    },
    list(query: ArtifactListQuery): { rows: ArtifactRecord[]; total: number } {
      const { where, params } = buildFilters(query)
      const { column, direction } = parseSort(query.sort)
      const total = (
        db.prepare(`SELECT COUNT(*) AS total FROM artifacts ${where}`).get(...params) as {
          total: number
        }
      ).total
      const rows = db
        .prepare(
          `SELECT * FROM artifacts ${where} ORDER BY ${column} ${direction} LIMIT ? OFFSET ?`,
        )
        .all(...params, query.perPage, (query.page - 1) * query.perPage) as ArtifactRow[]
      return { rows: rows.map(mapArtifact), total }
    },
    folderCounts(query: Pick<ArtifactListQuery, 'status' | 'q'>): Record<string, number> {
      const { where, params } = buildFilters({ ...query, folder: undefined })
      const rows = db
        .prepare(`SELECT folder, COUNT(*) AS total FROM artifacts ${where} GROUP BY folder`)
        .all(...params) as { folder: string; total: number }[]
      const counts = { docs: 0, tests: 0, ops: 0, tools: 0, comms: 0, all: 0 }
      for (const row of rows) {
        counts[row.folder as keyof typeof counts] = row.total
        counts.all += row.total
      }
      return counts
    },
    insert(artifact: ArtifactRecord): void {
      insertStmt.run({
        id: artifact.id,
        slug: artifact.slug,
        name: artifact.name,
        folder: artifact.folder,
        path: artifact.path,
        description: artifact.description,
        status: artifact.status,
        created_by: artifact.createdBy,
        updated_by: artifact.updatedBy,
        created_at: artifact.createdAt,
        updated_at: artifact.updatedAt,
      })
    },
    upsertBySlug(artifact: ArtifactRecord): void {
      upsertBySlugStmt.run({
        id: artifact.id,
        slug: artifact.slug,
        name: artifact.name,
        folder: artifact.folder,
        path: artifact.path,
        description: artifact.description,
        status: artifact.status,
        created_by: artifact.createdBy,
        updated_by: artifact.updatedBy,
        created_at: artifact.createdAt,
        updated_at: artifact.updatedAt,
      })
    },
    update(id: string, patch: Partial<ArtifactRecord> & { updatedAt: string; updatedBy: string }): void {
      const current = this.findById(id)
      if (!current) return
      const next = { ...current, ...patch }
      db.prepare(`
        UPDATE artifacts SET
          slug = @slug,
          name = @name,
          folder = @folder,
          path = @path,
          description = @description,
          status = @status,
          updated_by = @updated_by,
          updated_at = @updated_at
        WHERE id = @id
      `).run({
        id,
        slug: next.slug,
        name: next.name,
        folder: next.folder,
        path: next.path,
        description: next.description,
        status: next.status,
        updated_by: next.updatedBy,
        updated_at: next.updatedAt,
      })
    },
    delete(id: string): boolean {
      return deleteStmt.run(id).changes > 0
    },
  }
}

export type ArtifactRepository = ReturnType<typeof createArtifactRepository>
