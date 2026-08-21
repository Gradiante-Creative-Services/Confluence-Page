import { loadConfig } from './config.ts'
import { openDatabase } from './db/client.ts'
import { migrate } from './db/migrate.ts'
import { runSeedCli } from '../seeds/seed.ts'

const command = process.argv[2]

if (command === 'migrate') {
  const config = loadConfig()
  const db = openDatabase(config.databasePath)
  const ran = migrate(db)
  db.close()
  console.log(ran.length > 0 ? `Applied: ${ran.join(', ')}` : 'No pending migrations')
} else if (command === 'seed') {
  runSeedCli()
} else {
  console.error('Usage: tsx server/src/cli.ts <migrate|seed>')
  process.exit(1)
}
