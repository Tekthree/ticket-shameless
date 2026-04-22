import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'

export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ||
  `https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev`

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export function r2PublicUrl(key: string): string {
  const encoded = key.split('/').map(segment => encodeURIComponent(segment)).join('/')
  return `${R2_PUBLIC_URL}/${encoded}`
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(r2, cmd, { expiresIn })
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}

export function keyFromUrl(url: string): string {
  const base = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL : `${R2_PUBLIC_URL}/`
  return url.startsWith(base) ? url.slice(base.length) : url
}

export async function getGalleryImages(prefix = '', limit = 20): Promise<string[]> {
  try {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      MaxKeys: limit,
    }))
    return (res.Contents ?? [])
      .filter(o => o.Key && !o.Key.endsWith('/'))
      .map(o => r2PublicUrl(o.Key!))
  } catch {
    return []
  }
}
