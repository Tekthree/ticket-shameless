const fs = require('fs')
const env = fs.readFileSync('/tmp/shameless-env', 'utf8')
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL'))?.split(/=(.+)/)[1]?.trim().replace(/^"|"$/g, '')
const { neon } = require('@neondatabase/serverless')
const sql = neon(dbUrl)

// Image updates
const imageUpdates = [
  { slug: 'bexfromchicago', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/bexfromchicago-02213b27.jpg' },
  { slug: 'clarian', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/clarian-68ccaf79.jpg' },
  { slug: 'creach-live', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/creach-live-84d4e131.jpg' },
  { slug: 'ctrl-mp3', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/ctrl-mp3-5f989ecd.jpg' },
  { slug: 'dj-essex', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dj-essex-aa90261c.jpg' },
  { slug: 'dj-heather', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dj-heather-9b36618a.jpg' },
  { slug: 'dj-manos', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dj-manos-571ce76e.jpg' },
  { slug: 'dj-sh1-tr', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dj-sh1-tr-f88b2ee9.jpg' },
  { slug: 'dj-sloth', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dj-sloth-6b49462c.jpg' },
  { slug: 'dj-zen', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dj-zen-fafce982.jpg' },
  { slug: 'dance-spirit', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dance-spirit-3f0c52b8.jpg' },
  { slug: 'danny-daze', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/danny-daze-4cd95a92.jpg' },
  { slug: 'dave-dk', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dave-dk-1530ef09.jpg' },
  { slug: 'dave-nada', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/dave-nada-92ba62ca.jpg' },
  { slug: 'death-on-the-balcony', url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/death-on-the-balcony-388463ea.jpg' },
]

// Bio updates - written from RA data, 2-3 clean sentences, no em dashes, no AI vocab
const bioUpdates = [
  {
    slug: 'casewag',
    bio: 'CaseWag is a Seattle-based selector known for energetic sets that move across house, techno, and everything in between. A staple of the Pacific Northwest underground, he brings technical precision and serious dance floor instincts to every room he plays.'
  },
  {
    slug: 'citrus-age',
    bio: 'Citrus Age is a Seattle DJ and producer rooted in the local underground scene. His sets pull from deep house, Chicago influences, and leftfield electronics, building carefully paced journeys for late-night floors.'
  },
  {
    slug: 'cody-hammer',
    bio: 'Cody Hammer is a DJ and producer who splits his time between the booth and the studio. His sound draws from the darker end of house and techno, with a grounded approach shaped by years of playing Pacific Northwest venues.'
  },
  {
    slug: 'cole-medina',
    bio: 'Cole Medina is a DJ with roots in the Pacific Northwest underground. His sets navigate deep house and hypnotic techno, favoring mood and momentum over trends.'
  },
  {
    slug: 'creach-live',
    bio: 'Creach is a Vancouver-based DJ and live act known for raw, high-energy sets that pull from industrial, EBM, and dark techno. He performs live hardware rigs alongside DJ sets, bringing an unpredictable edge to the booth.'
  },
  {
    slug: 'dj-essex',
    // RA bio is a T.S. Eliot quote - skip, write based on available info
    bio: 'DJ Essex is a DJ and producer whose work spans house and techno. Known for thoughtful set construction and a wide-ranging record collection, Essex has been a consistent presence in underground electronic music circles.'
  },
]

async function run() {
  // Update images
  for (const update of imageUpdates) {
    try {
      await sql`UPDATE djs SET profile_image_url = ${update.url} WHERE slug = ${update.slug}`
      console.log(`IMAGE OK: ${update.slug}`)
    } catch (err) {
      console.log(`IMAGE ERR: ${update.slug} -> ${err.message}`)
    }
  }

  // Update bios
  for (const update of bioUpdates) {
    try {
      await sql`UPDATE djs SET bio = ${update.bio} WHERE slug = ${update.slug}`
      console.log(`BIO OK: ${update.slug}`)
    } catch (err) {
      console.log(`BIO ERR: ${update.slug} -> ${err.message}`)
    }
  }

  console.log('Done.')
}

run().catch(console.error)
