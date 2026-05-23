import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const R2 = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

// Full pool — all images in events/gallery/. Component picks 10 randomly per render.
const GALLERY_POOL = [
  `${R2}/events/gallery/01.jpg`,
  `${R2}/events/gallery/02.jpg`,
  `${R2}/events/gallery/03.jpg`,
  `${R2}/events/gallery/04.jpg`,
  `${R2}/events/gallery/05.jpg`,
  `${R2}/events/gallery/06.jpg`,
  `${R2}/events/gallery/07.jpg`,
  `${R2}/events/gallery/08.jpg`,
  `${R2}/events/gallery/09.jpg`,
  `${R2}/events/gallery/10.jpg`,
  `${R2}/events/gallery/1423126115878452.jpg`,
  `${R2}/events/gallery/1423126785878385.jpg`,
  `${R2}/events/gallery/1423127415878322.jpg`,
  `${R2}/events/gallery/1423130402544690.jpg`,
  `${R2}/events/gallery/1423130752544655.jpg`,
  `${R2}/events/gallery/1423131385877925.jpg`,
  `${R2}/events/gallery/1423131455877918.jpg`,
  `${R2}/events/gallery/1423131799211217.jpg`,
  `${R2}/events/gallery/1423131922544538.jpg`,
  `${R2}/events/gallery/1423132532544477.jpg`,
  `${R2}/events/gallery/1423132662544464.jpg`,
]

async function run() {
  const result = await sql`
    UPDATE events SET gallery_images = ${GALLERY_POOL}
    WHERE date > now() AND is_published = true
    RETURNING slug
  `
  result.forEach(r => console.log('  set', GALLERY_POOL.length, 'photos for', r.slug))
  console.log(`\nUpdated ${result.length} events. Done!`)
}

run().catch(e => { console.error(e); process.exit(1) })
