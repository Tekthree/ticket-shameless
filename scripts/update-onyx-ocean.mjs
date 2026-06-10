import { readFileSync } from 'fs'
import { chromium } from 'playwright'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import https from 'https'
import { randomUUID } from 'crypto'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)

const sql = neon(envVars.DATABASE_URL)
const R2_PUBLIC_URL = envVars.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const BUCKET = envVars.R2_BUCKET || 'shameless-party-images'
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${envVars.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: envVars.R2_ACCESS_KEY_ID, secretAccessKey: envVars.R2_SECRET_ACCESS_KEY },
})

const BIO = `After just over a year of DJ experience in the PNW scene, Onyx Ocean quickly established herself as a force to be reckoned with.

Her most notable recent appearance was as the opening act for The Crystal Method.

Throughout 2025, Onyx shared lineups with A Hundred Drums, UFO!, Phantom45, Mikey Lion, Marbs, Brett Johnson, Creach, and local legends Riz'N Robs (Won Love), Tony H, Luke Mandala, Iris, and Raica.

In her first year performing, she played sets for Emergence DNB, Quantum, Deep N Bass, Be My Guest, The Petricorps Sound System, Train Car House Party, Elevated Frequencies, Shameless Productions, Innerflight Music, Uniting Souls, Imagine Music and Arts Festival, and Cascadia NW Arts and Music Festival.

With a history in the festival and dance scene dating back to the age of 7, Onyx eventually began working in event production. She developed a deep love for her local underground scene, and a profound respect for those who run it. She is currently the youngest core crew member on the Cascadia festival team.

At the age of 11, Onyx completed the FCC training and became the youngest certified DJ on the community radio station KAOS. She and her mom are a DJ duo known as "Shaman's Dose." Together, they host "Kitty Kat Cul-de-sac" every other Sunday.

Onyx prides herself on her track selection. During any given day, you may catch her spinning Acid, Breakbeats, Drum & Bass, UKG, House, Techno, and Psytrance.

Whether you find her at a renegade, warehouse, or festival stage, her sets are crafted with intentional energy and emotional depth. Prepare yourself for a journey through dynamic atmosphere and driving basslines.`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' })
await page.goto('https://www.instagram.com/p/DQshFB5AbEO/', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(3000)
const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content')).catch(() => null)
await browser.close()

if (!ogImage) { console.log('No og:image found'); process.exit(1) }
console.log('Got image:', ogImage.slice(0, 80))

const buf = await new Promise((res, rej) => {
  https.get(ogImage, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
    const chunks = []
    r.on('data', c => chunks.push(c))
    r.on('end', () => res(Buffer.concat(chunks)))
    r.on('error', rej)
  }).on('error', rej)
})
console.log('Downloaded', buf.length, 'bytes')

const key = `djs/onyx-ocean-${randomUUID().slice(0, 8)}.jpg`
await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: 'image/jpeg' }))
const imageUrl = `${R2_PUBLIC_URL}/${encodeURIComponent(key)}`
console.log('Uploaded:', imageUrl)

const [row] = await sql`
  UPDATE djs
  SET profile_image_url = ${imageUrl},
      bio = ${BIO},
      soundcloud_url = 'https://soundcloud.com/onyx-ocean'
  WHERE slug = 'onyx'
  RETURNING name, slug, soundcloud_url
`
console.log('Done:', JSON.stringify(row))
