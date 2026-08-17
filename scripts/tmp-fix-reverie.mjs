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
    title: 'Reverie Society: David Scuba',
    description: `A Sunday day party from Viva, Uniting Souls and Shameless — Sunday 8/23/26 w/ David Scuba.

Reverie Society. Every Sunday, 3pm-8pm at Monkey Loft.

DJ's:
David Scuba
Jon Lee
DY3
Tek Jones

3-8 pm. Every Sunday. Shameless, Uniting Souls, Viva recordings.

Expect daytime party vibes, house music with all your friends, and Monkey Loft serving up happy hour drinks, including non-alcoholic options.

21+`,
    lineup: ['David Scuba', 'Jon Lee', 'DY3', 'Tek Jones'],
  },
  {
    slug: 'reverie-society-sunday-83026-diffusion-takeover',
    title: 'Reverie Society: Diffusion Takeover',
    description: `A Sunday day party from Uniting Souls, Viva and Shameless — Sunday 8/30/26 w/ the Diffusion crew!

DJ's:
Zeebo
Shaun Whitcher
Sean Wood
Onyx Ocean
Hazelwood

3-8 pm. Every Sunday. Shameless, Uniting Souls, Viva recordings.

Expect daytime party vibes, house music with all your friends, and Monkey Loft serving up happy hour drinks, including non-alcoholic options.

21+`,
    lineup: ['Zeebo', 'Shaun Whitcher', 'Sean Wood', 'Onyx Ocean', 'Hazelwood'],
  },
]

for (const ev of events) {
  const rows = await sql`UPDATE events SET title = ${ev.title}, description = ${ev.description} WHERE slug = ${ev.slug} RETURNING id, slug, title`
  if (rows.length === 0) { console.log(`NOT FOUND: ${ev.slug}`); continue }
  const eventId = rows[0].id
  console.log(`Updated: ${rows[0].title} (${rows[0].slug})`)

  await sql`DELETE FROM lineup WHERE event_id = ${eventId}`

  for (let i = 0; i < ev.lineup.length; i++) {
    const name = ev.lineup[i]
    const djRows = await sql`SELECT id FROM djs WHERE lower(name) = lower(${name}) LIMIT 1`
    const djId = djRows[0]?.id ?? null
    await sql`INSERT INTO lineup (event_id, name, dj_id, sort_order, stage) VALUES (${eventId}, ${name}, ${djId}, ${i}, NULL)`
  }
  console.log(`  Lineup set: ${ev.lineup.join(', ')}`)
}
