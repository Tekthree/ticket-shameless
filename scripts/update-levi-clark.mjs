import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)

const sql = neon(envVars.DATABASE_URL)

const BIO = `Levi Clark is one of Shameless Productions' core residents, and he's been with the crew long enough to be infrastructure rather than a booking note. Shameless is one of Seattle's longest-running underground dance collectives, and Levi's name is a fixture on their lineups.

He's a regular at the Monkey Loft and Deck'd Out, the crew's outdoor rooftop series. His sets move through high-energy house into darker, underground warehouse techno, often sharing bills with Shameless co-founders Recess, Jen Woolfe, and Tek Jones.

Catch his mixes on SoundCloud or find upcoming shows on EmeraldCityEDM.`

const [row] = await sql`
  UPDATE djs
  SET
    bio = ${BIO},
    instagram_url = NULL,
    website_url = 'https://linktr.ee/leviclark'
  WHERE slug = 'levi-clark'
  RETURNING name, slug, instagram_url, website_url, bio
`

if (!row) {
  console.log('No row found for slug levi-clark')
  process.exit(1)
}

console.log('Updated:', row.name, '/', row.slug)
console.log('Instagram:', row.instagram_url)
console.log('Website:', row.website_url)
console.log(row.bio)
