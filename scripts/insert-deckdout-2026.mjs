import fs from 'fs'
import { neon } from '@neondatabase/serverless'

const raw = fs.readFileSync('/tmp/vercel-prod-env', 'utf8')
let DATABASE_URL = ''
for (const line of raw.split('\n')) {
  const eqIdx = line.indexOf('=')
  if (eqIdx === -1) continue
  const key = line.slice(0, eqIdx).trim()
  if (key === 'DATABASE_URL') {
    DATABASE_URL = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
    break
  }
}

const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

const description = `For the 14th summer, Deck'd Out returns!
Now starting June 18th, we'll be hosting at least 13 events every Thursday from 7p-11p up until the closing party Sept 10th. Plenty of time to catch that sunset while dancing with your friends and yet still head home at a decent hour to get some sleep.
This season ticket pass provides unlimted access all summer long along with ease of entry (skip the line!). This year we're hosting one more date then last year but keeping the ticket prices the same. Call it a baker's dozen. Plus if the weather/venue allows us to do a soft opening or two, there's no extra charge to our season ticket pass holders. Oh and a suprise shameless gift will be waiting for you upon your first visit this summer.
Full summer line up to be announced soon.
*Please note that season passes are not transferable/refundable`

const result = await sql`
  INSERT INTO events (
    slug, title, description, date, end_date,
    venue, address, tags,
    payment_link, suggested_price,
    is_published, is_public
  ) VALUES (
    'deckd-out-2026-summer-season',
    'Deck''d Out - 2026 Summer Season',
    ${description},
    '2026-06-19T02:00:00.000Z',
    '2026-06-19T06:00:00.000Z',
    'Monkey Loft',
    '2911 1st Ave S, Seattle, WA 98134',
    ARRAY[]::text[],
    'https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830',
    null,
    true, true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug, title, date
`

if (result.length > 0) {
  console.log('Inserted:', result[0].title)
  console.log('  id:', result[0].id)
  console.log('  date:', result[0].date)
} else {
  console.log('Already exists — no insert (slug conflict)')
}
