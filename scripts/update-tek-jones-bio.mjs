import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)

const sql = neon(envVars.DATABASE_URL)

const BIO = `Tek Jones has been in the game since 2000. It started in Okinawa, Japan, where he got hooked on Acid House and started Okizoo Crew, a collective with a mission to bring that sound to the world. From there, residencies in Seattle and Denver, including Club Beta, and Shameless Productions since 2016.

His sets sit in deep house, acid house, and groovy bass territory. The 2023 guest mix he recorded for KEXP's Midnight in a Perfect World is a good snapshot: fresh house cuts, different shades of the genre, smooth from front to back.

Under the name Ghostboy Jones, he goes deeper and more atmospheric, often alongside West Coast artists like Caustik. The "Around the Fire" sessions are his long-form late-night format.`

const [row] = await sql`
  UPDATE djs
  SET bio = ${BIO}
  WHERE slug = 'tek-jones'
  RETURNING name, slug, bio
`

if (!row) {
  console.log('No row found for slug tek-jones')
  process.exit(1)
}

console.log('Updated:', row.name, '/', row.slug)
console.log(row.bio)
