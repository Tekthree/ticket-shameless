/**
 * Upload shameless-logo.png to R2 as the Shameless Residents profile image,
 * then update the djs table.
 */
import { readFileSync } from 'fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'

const envPath = new URL('../.env.local', import.meta.url).pathname
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')] })
)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${envVars.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: envVars.R2_ACCESS_KEY_ID,
    secretAccessKey: envVars.R2_SECRET_ACCESS_KEY,
  },
})

const sql = neon(envVars.DATABASE_URL)
const R2_PUBLIC_URL = envVars.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const BUCKET = envVars.R2_BUCKET || 'shameless-party-images'

// Upload logo
const logoPath = new URL('../public/shameless-logo.png', import.meta.url).pathname
const logoData = readFileSync(logoPath)
const key = 'dj-profiles/shameless-residents.png'

await r2.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: key,
  Body: logoData,
  ContentType: 'image/png',
}))

const imageUrl = `${R2_PUBLIC_URL}/${encodeURIComponent(key)}`
console.log(`Uploaded: ${imageUrl}`)

// Update DB
await sql`
  UPDATE djs
  SET profile_image_url = ${imageUrl}
  WHERE slug = 'shameless-residents'
`
console.log('Updated Shameless Residents profile image.')
