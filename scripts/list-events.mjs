import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] })
    .filter(([k]) => k)
)

console.log('Connecting to:', env.DATABASE_URL?.slice(0, 60))

const sql = neon(env.DATABASE_URL)
const events = await sql`SELECT id, slug, title, date FROM events ORDER BY date`
console.log(`\n${events.length} events in DB:`)
for (const e of events) {
  console.log(` - ${e.slug} | ${e.title} | ${e.date}`)
}
