import { Client } from 'pg'
import { readFileSync } from 'fs'

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: tsx scripts/run-sql-migration.ts <path-to-sql>')
    process.exit(1)
  }
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }
  const sql = readFileSync(file, 'utf8')
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log(`Applied migration: ${file}`)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('Migration failed:', e.message)
  process.exit(1)
})

