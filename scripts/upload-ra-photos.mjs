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

// RA profile image URLs gathered from ra.co/dj/[slug]
const RA_PHOTOS = [
  {
    slug: 'mikey-lion',
    url: 'https://imgproxy.ra.co/_/quality:66/aHR0cHM6Ly9zdGF0aWMucmEuY28vaW1hZ2VzL3Byb2ZpbGVzL2xnL21pa2V5bGlvbi5qcGc_ZGF0ZVVwZGF0ZWQ9MTQ2NDY1NzE1NzcyMA==',
  },
  {
    slug: 'lee-reynolds',
    url: 'https://imgproxy.ra.co/_/quality:66/aHR0cHM6Ly9zdGF0aWMucmEuY28vaW1hZ2VzL3Byb2ZpbGVzL2xnL2xlZXJleW5vbGRzLmpwZz9kYXRlVXBkYXRlZD0xNDQ0MTc3NjI1MDkw',
  },
  {
    slug: 'marbs',
    url: 'https://imgproxy.ra.co/_/quality:66/aHR0cHM6Ly9zdGF0aWMucmEuY28vaW1hZ2VzL3Byb2ZpbGVzL2xnL21hcmJzLmpwZz9kYXRlVXBkYXRlZD0xNDI0MjM5MTE5NDAz',
  },
  {
    slug: 'mr-linden',
    url: 'https://imgproxy.ra.co/_/quality:66/aHR0cHM6Ly9zdGF0aWMucmEuY28vaW1hZ2VzL3Byb2ZpbGVzL2xnL21ybGluZGVuLmpwZz9kYXRlVXBkYXRlZD0xNzY2MDg0MzExNjI3',
  },
  {
    slug: 'kadeejah-streets',
    url: 'https://imgproxy.ra.co/_/quality:66/aHR0cHM6Ly9zdGF0aWMucmEuY28vaW1hZ2VzL3Byb2ZpbGVzL2xnL2thZGVlamFoc3RyZWV0cy5qcGc_ZGF0ZVVwZGF0ZWQ9MTI2NjAxNTA5MDAwMA==',
  },
]

async function downloadAndUpload(slug, sourceUrl) {
  const res = await fetch(sourceUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${sourceUrl}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const key = `djs/${randomUUID()}.${ext}`
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: buffer,
    ContentType: contentType, ContentLength: buffer.byteLength,
  }))
  return `${R2_PUBLIC_URL}/${key}`
}

console.log('Uploading RA profile photos to R2...\n')

for (const { slug, url } of RA_PHOTOS) {
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
