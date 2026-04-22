import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, getPresignedUploadUrl, r2PublicUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 10

// POST /api/upload?mode=presign  → returns { uploadUrl, publicUrl, key }
// POST /api/upload               → multipart upload, returns { url, key }
export async function POST(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode')

  if (mode === 'presign') {
    const { filename, contentType, folder = 'uploads' } = await req.json()

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const ext = filename.split('.').pop() ?? 'jpg'
    const key = `${folder}/${randomUUID()}.${ext}`
    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, publicUrl: r2PublicUrl(key), key })
  }

  // Direct multipart upload
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) ?? 'uploads'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File exceeds ${MAX_SIZE_MB}MB limit` }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const key = `${folder}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || 'shameless-party-images',
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.byteLength,
    })
  )

  return NextResponse.json({ url: r2PublicUrl(key), key })
}
