import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'

loadEnvConfig(process.cwd())

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const DATABASE_URL = process.env.DATABASE_URL

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const sql = neon(DATABASE_URL)

// SoundCloud avatar URLs (500x500) from oembed API
const SC_PHOTOS = [
  { slug: 'nick-bertossi', url: 'https://i1.sndcdn.com/avatars-1YjPoymZeEnC05xU-GURW6Q-t500x500.jpg' },
  { slug: 'poof',          url: 'https://i1.sndcdn.com/avatars-IyDkiy6ssE9XgSOX-yyPXaQ-t500x500.jpg' },
  { slug: 'hector-j-rodriguez', url: 'https://i1.sndcdn.com/avatars-BONSyTHy4Zk0L9Ix-ctFBKw-t500x500.jpg' },
  { slug: 'kadeem-taves',  url: 'https://i1.sndcdn.com/avatars-4MGhZzeN7uG96jkz-M9JYJw-t500x500.jpg' },
]

async function downloadAndUpload(slug, sourceUrl) {
  const res = await fetch(sourceUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const key = `djs/${randomUUID()}.jpg`
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: buffer,
    ContentType: 'image/jpeg', ContentLength: buffer.byteLength,
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

console.log('Uploading SoundCloud profile photos to R2...\n')

for (const { slug, url } of SC_PHOTOS) {
  try {
    const r2Url = await downloadAndUpload(slug, url)
    const rows = await sql`
      update djs set profile_image_url = ${r2Url}
      where slug = ${slug}
      returning slug, name
    `
    console.log(`✓ ${rows[0]?.name} → ${r2Url}`)
  } catch (e) {
    console.log(`✗ ${slug}: ${e.message}`)
  }
}

console.log('\nDone.')
