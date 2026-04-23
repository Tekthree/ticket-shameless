import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

loadEnvConfig(process.cwd())

const DATABASE_URL = process.env.DATABASE_URL
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const sql = neon(DATABASE_URL)

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uploadPhoto(filePath, slug) {
  try {
    const buffer = readFileSync(filePath)
    const ext = filePath.split('.').pop().toLowerCase().replace('jpeg', 'jpg')
    const key = `djs/${randomUUID()}.${ext}`
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, Body: buffer,
      ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      ContentLength: buffer.byteLength,
    }))
    const url = `${R2_PUBLIC_URL}/${key}`
    console.log(`  Photo uploaded for ${slug}: ${url}`)
    return url
  } catch (e) {
    console.log(`  No photo for ${slug}: ${e.message}`)
    return null
  }
}

// All DJs to create (name + optional photo path)
const DJS_TO_CREATE = [
  // Hijinks lineup
  { name: 'Mikey Lion',      photo: null },
  { name: 'Lee Reynolds',    photo: null },
  { name: 'Marbs',           photo: null },
  { name: 'DJ Recess',       photo: '/mnt/e/WORK/SHAMELESS/The Breakfast Club 2026/The Breakfast Club 2026 Artist Pictures/Recess.jpg' },
  { name: 'Sloane Motion',   photo: null },
  { name: 'Julie Herrera',   photo: null },
  { name: 'Cheeks',          photo: null },
  // Reverie lineup
  { name: 'Rick Preston',    photo: null },
  { name: 'Mr. Linden',      photo: null },
  { name: 'Hector J Rodriguez', photo: null },
  { name: 'Kadeem Taves',    photo: null },
]

console.log('Creating DJ profiles...\n')

for (const dj of DJS_TO_CREATE) {
  const slug = toSlug(dj.name)
  let photoUrl = null
  if (dj.photo) photoUrl = await uploadPhoto(dj.photo, slug)

  const rows = await sql`
    insert into djs (slug, name, profile_image_url, is_published)
    values (${slug}, ${dj.name}, ${photoUrl}, true)
    on conflict (slug) do update set
      name = excluded.name,
      profile_image_url = coalesce(excluded.profile_image_url, djs.profile_image_url)
    returning id, slug, name
  `
  console.log(`Created: ${rows[0].name} → /djs/${rows[0].slug}`)
}

// Now link all lineup entries to their DJ profiles by matching name
console.log('\nLinking lineup entries to profiles...\n')
const allDJs = await sql`select id, slug, name from djs`
const djMap = {}
for (const d of allDJs) djMap[d.name.toLowerCase()] = d

const lineupRows = await sql`
  select l.id, l.name, l.event_id, e.title as event_title
  from lineup l
  join events e on e.id = l.event_id
  where l.dj_id is null
`

let linked = 0
for (const row of lineupRows) {
  const match = djMap[row.name.toLowerCase()]
  if (match) {
    await sql`update lineup set dj_id = ${match.id} where id = ${row.id}`
    console.log(`Linked: "${row.name}" on "${row.event_title}" → /djs/${match.slug}`)
    linked++
  } else {
    console.log(`No match: "${row.name}" on "${row.event_title}"`)
  }
}

console.log(`\nDone. ${linked} lineup entries linked.`)
