import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const R2 = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

// Shared gallery — same 10 photos used across all Deck'd Out events
// Upload photos to R2 at events/gallery/01.jpg through 10.jpg
const SHARED_PHOTOS = Array.from({ length: 10 }, (_, i) =>
  `${R2}/events/gallery/${String(i + 1).padStart(2, '0')}.jpg`
)

const SLUGS = [
  'deckd-out-1-season-opener-shvili-nyc-sky-rivers-la-all-vinyl',
  'deckd-out-2-pride-edition-w-open-house-collective-idle',
  'deckd-out-3-off99-shameless-present-dj-said-sf-costa-showcase',
  'deckd-out-4-give-n-groove-shameless-present-headliner-tba-france',
  'deckd-out-5-shameless-presents-jason-peters-sf-best-butt-camp',
  'deckd-out-6-sassmouth-chi-nark-bottom-forty-has-catz',
  'deckd-out-7-sazn-shameless-present-mango-ginger-la-more',
  'deckd-out-8-innerflight-shameless-feat-garth-wicked-nightmoves',
  'deckd-out-9-flammable-shameless-pres-gene-hunt-traxchi-flamm-djs',
  'deckd-out-10-lnm-shameless-pres-cami-jones-ibiza-11-year-anniv',
]

async function run() {
  for (const slug of SLUGS) {
    const result = await sql`
      UPDATE events SET gallery_images = ${SHARED_PHOTOS} WHERE slug = ${slug} RETURNING slug
    `
    if (result.length) console.log('  set', SHARED_PHOTOS.length, 'photos for', slug)
    else console.log('  NOT FOUND:', slug)
  }
  console.log('Done!')
}

run().catch(e => { console.error(e); process.exit(1) })
