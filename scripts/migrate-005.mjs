import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] })
    .filter(([k]) => k)
)

const sql = neon(env.DATABASE_URL)

await sql`ALTER TABLE djs ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}'`
console.log('OK: djs.aliases')

await sql`ALTER TABLE djs ADD COLUMN IF NOT EXISTS is_resident BOOLEAN DEFAULT false`
console.log('OK: djs.is_resident')

await sql`CREATE INDEX IF NOT EXISTS idx_djs_aliases ON djs USING GIN(aliases)`
console.log('OK: idx_djs_aliases')

console.log('\nMigration 005 complete.')
