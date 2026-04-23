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

const PHOTOS = [
  // Massive Club resident pages
  {
    slug: 'shortstack',
    url: 'https://cdn.prod.website-files.com/659447a9dbb86fcea688b307/675a79445db07f6829c89ca5_image-0005.webp',
    ext: 'webp',
  },
  {
    slug: 'yourmom',
    url: 'https://cdn.prod.website-files.com/659447a9dbb86fcea688b307/675a79c2ffc174df686166cf_image-0007.webp',
    ext: 'webp',
  },
  // SoundCloud avatar
  {
    slug: 'rick-preston',
    url: 'https://i1.sndcdn.com/avatars-kU6kfYf4NYhEDo8D-ZuUzxg-t500x500.jpg',
    ext: 'jpg',
  },
]

async function downloadAndUpload(slug, sourceUrl, ext) {
  const res = await fetch(sourceUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const key = `djs/${randomUUID()}.${ext}`
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: buffer,
    ContentType: contentType, ContentLength: buffer.byteLength,
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

console.log('Uploading remaining profile photos to R2...\n')

for (const { slug, url, ext } of PHOTOS) {
  try {
    const r2Url = await downloadAndUpload(slug, url, ext)
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
