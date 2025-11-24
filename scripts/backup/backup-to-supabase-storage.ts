import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
import { createReadStream, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  const databaseUrl = process.env.DATABASE_URL
  const bucket = process.env.BACKUP_BUCKET || 'backups'
  const prefix = process.env.BACKUP_PREFIX || 'db'
  if (!supabaseUrl || !supabaseKey || !databaseUrl) {
    console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${prefix}-${ts}.sql`
  const filepath = join(tmpdir(), filename)

  await new Promise<void>((resolve, reject) => {
    const cmd = spawn('pg_dump', [databaseUrl, '-Fc', '-f', filepath], { stdio: 'inherit' })
    cmd.on('error', reject)
    cmd.on('exit', (code) => {
      if (code === 0 && existsSync(filepath)) resolve()
      else reject(new Error('pg_dump failed'))
    })
  })

  const stream = createReadStream(filepath)
  const { error } = await supabase.storage.from(bucket).upload(`/${filename}`, stream, {
    contentType: 'application/octet-stream',
    duplex: 'half'
  } as any)
  if (error) {
    console.error('Upload error', error.message)
    process.exit(1)
  }
  console.log(`Uploaded ${filename} to bucket ${bucket}`)
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})