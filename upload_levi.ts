import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev`

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const sql = neon(process.env.DATABASE_URL!)

async function uploadAndSet() {
  const filePath = '/home/tekthree/ticket-shameless/levi_clark.jpg'
  const fileContent = readFileSync(filePath)

  const key = `djs/leviclark_${Date.now()}.jpg`
  
  console.log('Uploading to R2...', key)
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: 'image/jpeg',
  }))

  const newUrl = `${R2_PUBLIC_URL}/${key}`
  console.log('Uploaded! New URL:', newUrl)

  console.log('Updating database...')
  const result = await sql`
    UPDATE djs 
    SET profile_image_url = ${newUrl} 
    WHERE name ILIKE '%Levi Clark%'
    RETURNING id, name, profile_image_url
  `
  console.log('Updated DB:', result)
}

uploadAndSet().catch(console.error)
