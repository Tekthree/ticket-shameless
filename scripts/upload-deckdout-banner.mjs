import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

// All creds from prod env
const prodEnv = readFileSync('/tmp/vercel-prod-env', 'utf8')
const getProd = (key) => {
  for (const line of prodEnv.split('\n')) {
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    if (line.slice(0, eqIdx).trim() === key) {
      return line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '')
    }
  }
  return ''
}

const DATABASE_URL = getProd('DATABASE_URL')
const R2_ACCOUNT_ID = getProd('R2_ACCOUNT_ID') || 'd85f1bb68ad7da530dccaef0eccc5e0b'
const R2_ACCESS_KEY_ID = getProd('R2_ACCESS_KEY_ID')
const R2_SECRET_ACCESS_KEY = getProd('R2_SECRET_ACCESS_KEY')
const R2_BUCKET = getProd('R2_BUCKET') || 'shameless-party-images'
const R2_PUBLIC_URL = getProd('R2_PUBLIC_URL') || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const imagePath = "/mnt/e/WORK/SHAMELESS/Deck'd out 2026/JPEG/Branding_Banner.jpg"
const buffer = readFileSync(imagePath)
const key = `events/${randomUUID()}.jpg`

console.log('Uploading Deck\'d Out 2026 banner to R2...')
await r2.send(new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: key,
  Body: buffer,
  ContentType: 'image/jpeg',
  ContentLength: buffer.byteLength,
}))

const publicUrl = `${R2_PUBLIC_URL}/${key}`
console.log('Uploaded:', publicUrl)

// Update the event
const sql = neon(DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
const result = await sql`
  UPDATE events
  SET image_url = ${publicUrl}, banner_url = ${publicUrl}
  WHERE slug = 'deckd-out-2026-summer-season'
  RETURNING id, title, image_url
`

if (result.length > 0) {
  console.log('Updated event:', result[0].title)
  console.log('Image URL:', result[0].image_url)
} else {
  console.log('Event not found')
}
