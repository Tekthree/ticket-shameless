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
    dir: '/mnt/e/WORK/SHAMELESS/Reverie Society/Aug 2026/Aug 23rd/JPEG',
    prefix: 'reverie-aug23',
  },
  {
    slug: 'reverie-society-sunday-83026-diffusion-takeover',
    dir: '/mnt/e/WORK/SHAMELESS/Reverie Society/Aug 2026/Aug 30th/JPEG',
    prefix: 'reverie-aug30',
  },
]

for (const ev of events) {
  const imageUrl = await upload(`${ev.dir}/800by1000-instagram.jpg`, `${ev.prefix}-800x1000.jpg`)
  console.log(`${ev.slug}  image_url  -> ${imageUrl}`)
  const bannerUrl = await upload(`${ev.dir}/Branding_Banner.jpg`, `${ev.prefix}-banner.jpg`)
  console.log(`${ev.slug}  banner_url -> ${bannerUrl}`)

  const rows = await sql`
    UPDATE events SET image_url = ${imageUrl}, banner_url = ${bannerUrl}
    WHERE slug = ${ev.slug}
    RETURNING slug, image_url, banner_url
  `
  console.log('  DB updated:', JSON.stringify(rows[0]))
}
