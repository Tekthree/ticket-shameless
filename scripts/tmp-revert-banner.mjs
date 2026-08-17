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

const events = [
  {
    slug: 'reverie-society-sunday-82326-david-scuba',
    wideBanner: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/788b5466-1538-4c0d-94d0-345efa2a4afb.jpg',
    squareImg: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/53d89817-c065-4ce9-8821-e1a6bd915bae.jpg',
  },
  {
    slug: 'reverie-society-sunday-83026-diffusion-takeover',
    wideBanner: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/0f8a02e7-9182-4e23-873f-bbab7afc8cef.jpg',
    squareImg: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/06d4a93d-d1f7-49d0-9208-69ec01698bbc.jpg',
  },
]

for (const ev of events) {
  const rows = await sql`
    UPDATE events SET banner_url = ${ev.wideBanner}, square_image_url = ${ev.squareImg}
    WHERE slug = ${ev.slug}
    RETURNING slug, banner_url, square_image_url
  `
  console.log(JSON.stringify(rows[0], null, 2))
}
