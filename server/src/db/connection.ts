import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from '../config/env.js'

let db: DatabaseSync | null = null

export function getDb(databasePath = env.databasePath): DatabaseSync {
  if (!db) {
    mkdirSync(dirname(databasePath), { recursive: true })
    db = new DatabaseSync(databasePath)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
  }
  return db
}

export function resetDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function setDb(instance: DatabaseSync): void {
  if (db) {
    db.close()
  }
  db = instance
}

export function isDbConnected(): boolean {
  try {
    getDb().prepare('SELECT 1').get()
    return true
  } catch {
    return false
  }
}
