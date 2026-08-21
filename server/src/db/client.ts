import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

export type SqliteDatabase = Database.Database

export function openDatabase(filePath: string): SqliteDatabase {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const db = new Database(filePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

export function openMemoryDatabase(): SqliteDatabase {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  return db
}
