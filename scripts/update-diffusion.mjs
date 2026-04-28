import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { readFileSync } from 'fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'

loadEnvConfig('/home/tekthree/ticket-shameless')

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
})

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'

const FLYER = '/mnt/e/WORK/SHAMELESS/Reverie Society/May/May 24/JPEG/Branding_Banner.jpg'
const buf = readFileSync(FLYER)
const key = 'events/reverie-diffusion-may24-banner.jpg'

console.log('Uploading...')
await r2.send(new PutObjectCommand({
  Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: 'image/jpeg', ContentLength: buf.byteLength
}))
const url = `${R2_PUBLIC_URL}/${key}`
console.log('Uploaded:', url)

const rows = await sql`
  UPDATE events
  SET image_url = ${url}, banner_url = ${url}, tags = ${['house','techno','day party','deep house']}
  WHERE slug = 'reverie-society-diffusion-takeover-saand-may-24-2026'
  RETURNING slug, image_url, banner_url, tags
`
console.log('Updated:', JSON.stringify(rows[0], null, 2))
