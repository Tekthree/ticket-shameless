import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const prodEnv = readFileSync('/tmp/vercel-prod-env', 'utf8')
function getProd(key) {
  for (const line of prodEnv.split('\n')) {
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    if (line.slice(0, eqIdx).trim() === key) return line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
  }
  return ''
}
const sql = neon(getProd('DATABASE_URL'), { fetchOptions: { cache: 'no-store' } })
const UPLOAD_URL = 'https://ticket-shameless.vercel.app/api/upload'

async function upload(filePath, filename) {
  const buffer = readFileSync(filePath)
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('folder', 'events')
  const res = await fetch(UPLOAD_URL, { method: 'POST', body: form })
  const json = await res.json()
  if (!json.url) throw new Error(`Upload failed for ${filename}: ${JSON.stringify(json)}`)
  return json.url
}

const events = [
  {
    slug: 'reverie-society-sunday-82326-david-scuba',
    file: '/tmp/claude-1000/-home-tekthree-zoo-bot/b6d3fe2d-a66e-407a-afce-9db818a19017/scratchpad/reverie-aug23-square-web.jpg',
    name: 'reverie-aug23-square.jpg',
  },
  {
    slug: 'reverie-society-sunday-83026-diffusion-takeover',
    file: '/tmp/claude-1000/-home-tekthree-zoo-bot/b6d3fe2d-a66e-407a-afce-9db818a19017/scratchpad/reverie-aug30-square-web.jpg',
    name: 'reverie-aug30-square.jpg',
  },
]

for (const ev of events) {
  const url = await upload(ev.file, ev.name)
  console.log(`${ev.slug} -> ${url}`)
  const rows = await sql`UPDATE events SET banner_url = ${url} WHERE slug = ${ev.slug} RETURNING slug, banner_url`
  console.log('  DB updated:', JSON.stringify(rows[0]))
}
