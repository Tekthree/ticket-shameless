import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) throw new Error('.env.local not found')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const { neon } = await import('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

const file = process.argv[2]
if (!file) { console.error('Usage: node run-migration.mjs <path-to-sql>'); process.exit(1) }

const migration = readFileSync(file, 'utf8')
console.log(`Running: ${file}`)
await sql.unsafe(migration)
console.log('Done.')
