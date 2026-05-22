import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const R2 = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

function photos(slug, count = 10) {
  return Array.from({ length: count }, (_, i) =>
    `${R2}/events/${slug}/${String(i + 1).padStart(2, '0')}.jpg`
  )
}

const GALLERY = [
  { slug: 'deckd-out-1-season-opener-shvili-nyc-sky-rivers-la-all-vinyl',      images: photos('deckd-out-1-season-opener-shvili-nyc-sky-rivers-la-all-vinyl') },
  { slug: 'deckd-out-2-pride-edition-w-open-house-collective-idle',             images: photos('deckd-out-2-pride-edition-w-open-house-collective-idle') },
  { slug: 'deckd-out-3-off99-shameless-present-dj-said-sf-costa-showcase',      images: photos('deckd-out-3-off99-shameless-present-dj-said-sf-costa-showcase') },
  { slug: 'deckd-out-4-give-n-groove-shameless-present-headliner-tba-france',   images: photos('deckd-out-4-give-n-groove-shameless-present-headliner-tba-france') },
  { slug: 'deckd-out-5-shameless-presents-jason-peters-sf-best-butt-camp',      images: photos('deckd-out-5-shameless-presents-jason-peters-sf-best-butt-camp') },
  { slug: 'deckd-out-6-sassmouth-chi-nark-bottom-forty-has-catz',               images: photos('deckd-out-6-sassmouth-chi-nark-bottom-forty-has-catz') },
  { slug: 'deckd-out-7-sazn-shameless-present-mango-ginger-la-more',            images: photos('deckd-out-7-sazn-shameless-present-mango-ginger-la-more') },
  { slug: 'deckd-out-8-innerflight-shameless-feat-garth-wicked-nightmoves',     images: photos('deckd-out-8-innerflight-shameless-feat-garth-wicked-nightmoves') },
  { slug: 'deckd-out-9-flammable-shameless-pres-gene-hunt-traxchi-flamm-djs',  images: photos('deckd-out-9-flammable-shameless-pres-gene-hunt-traxchi-flamm-djs') },
  { slug: 'deckd-out-10-lnm-shameless-pres-cami-jones-ibiza-11-year-anniv',    images: photos('deckd-out-10-lnm-shameless-pres-cami-jones-ibiza-11-year-anniv') },
]

async function run() {
  for (const { slug, images } of GALLERY) {
    const result = await sql`
      UPDATE events SET gallery_images = ${images} WHERE slug = ${slug} RETURNING slug
    `
    if (result.length) console.log('  set', images.length, 'photos for', slug)
    else console.log('  NOT FOUND:', slug)
  }
  console.log('Done!')
}

run().catch(e => { console.error(e); process.exit(1) })
