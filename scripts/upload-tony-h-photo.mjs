import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

const envFile = readFileSync('.env.local', 'utf8')
const get = (key) => {
  const m = envFile.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}

const R2_ACCOUNT_ID = get('R2_ACCOUNT_ID')
const R2_ACCESS_KEY_ID = get('R2_ACCESS_KEY_ID')
const R2_SECRET_ACCESS_KEY = get('R2_SECRET_ACCESS_KEY')
const R2_BUCKET = get('R2_BUCKET') || 'shameless-party-images'
const R2_PUBLIC_URL = get('R2_PUBLIC_URL') || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const DATABASE_URL = get('DATABASE_URL')

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const photoPath = '/mnt/e/WORK/SHAMELESS/The Breakfast Club 2026/The Breakfast Club 2026 Artist Pictures/tony_h.jpg'
const buffer = readFileSync(photoPath)
const key = `djs/${randomUUID()}.jpg`

console.log('Uploading tony_h.jpg to R2...')
await r2.send(new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: key,
  Body: buffer,
  ContentType: 'image/jpeg',
  ContentLength: buffer.byteLength,
}))

const publicUrl = `${R2_PUBLIC_URL}/${key}`
console.log('Uploaded:', publicUrl)

const sql = neon(DATABASE_URL)
const rows = await sql`
  update djs set profile_image_url = ${publicUrl}
  where slug = 'tony-h'
  returning id, slug, name, profile_image_url
`
console.log('Updated DJ:', rows[0])
