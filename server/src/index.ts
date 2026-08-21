import fs from 'node:fs'
import { loadConfig } from './config.ts'
import { createApp } from './app.ts'
import { openDatabase } from './db/client.ts'
import { migrate } from './db/migrate.ts'

const config = loadConfig()
fs.mkdirSync(config.uploadDir, { recursive: true })

const db = openDatabase(config.databasePath)
migrate(db)

const userCount = db.prepare('SELECT COUNT(*) AS total FROM users').get() as { total: number }
if (userCount.total === 0) {
  const { seedDatabase } = await import('../seeds/seed.ts')
  seedDatabase(db, config.uploadDir)
  console.log('Seeded demo users and artifacts')
}

const app = createApp({
  db,
  jwtSecret: config.jwtSecret,
  uploadDir: config.uploadDir,
})

app.listen(config.port, () => {
  console.log(`Confluence API listening on http://localhost:${config.port}`)
})
