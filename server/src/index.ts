import { createApp } from './app.js'
import { env } from './config/env.js'
import { runMigrations } from './db/migrate.js'
import { seedDatabase } from './db/seed.js'

runMigrations()
seedDatabase()

const app = createApp()

app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`)
})
