import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createRequire } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const rows = await sql`
  SELECT l.name, COUNT(*)::int as play_count
  FROM lineup l
  WHERE l.dj_id IS NULL AND l.name IS NOT NULL AND l.name != ''
  GROUP BY l.name
  ORDER BY play_count DESC, l.name ASC
`

console.log(JSON.stringify(rows))
