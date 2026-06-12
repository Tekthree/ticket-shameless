/**
 * Upload Deck'd Out 2026 square_back images to R2 and set square_image_url on events.
 *
 * Usage:
 *   node scripts/import-square-images.mjs [--dry-run]
 *
 * Reads .env.local for credentials.
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load .env.local
function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) throw new Error('.env.local not found')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
const { neon } = await import('@neondatabase/serverless')

const DRY_RUN = process.argv.includes('--dry-run')

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.R2_BUCKET || 'shameless-party-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const sql = neon(process.env.DATABASE_URL)

// Folder name → JS Date matching logic
// Folder names look like "Aug 6th", "July 23rd", "Sept 10th"
function parseFolderDate(folderName) {
  const clean = folderName
    .replace(/(\d+)(st|nd|rd|th)/i, '$1')  // "6th" → "6"
    .replace('Sept', 'Sep')                 // "Sept" → "Sep"
  return new Date(`${clean} 2026`)
}

// Find the square image file in a folder (handles naming quirks)
function findSquareFile(folderPath) {
  const files = readdirSync(folderPath)
  return files.find(f => f.toLowerCase().includes('square_back'))
}

const SHARE_BASE = '/mnt/e/WORK/SHAMELESS/Deck\'d out 2026/DJ Share'

async function main() {
  const events = await sql`select id, slug, title, date, square_image_url from events where is_published = true order by date asc`
  console.log(`Found ${events.length} published events\n`)

  const folders = readdirSync(SHARE_BASE).filter(f => {
    const full = join(SHARE_BASE, f)
    try { return readdirSync(full).length > 0 } catch { return false }
  })

  let matched = 0
  let skipped = 0

  for (const folder of folders) {
    const folderPath = join(SHARE_BASE, folder)
    const squareFile = findSquareFile(folderPath)
    if (!squareFile) {
      console.log(`  SKIP ${folder} — no square_back file found`)
      skipped++
      continue
    }

    let folderDate
    try {
      folderDate = parseFolderDate(folder)
    } catch {
      console.log(`  SKIP ${folder} — could not parse date`)
      skipped++
      continue
    }

    // Match to event by calendar date (same year + month + day)
    const match = events.find(e => {
      const d = new Date(e.date)
      return d.getFullYear() === folderDate.getFullYear()
        && d.getMonth() === folderDate.getMonth()
        && d.getDate() === folderDate.getDate()
    })

    if (!match) {
      console.log(`  NO MATCH ${folder} (${folderDate.toDateString()})`)
      skipped++
      continue
    }

    const imagePath = join(folderPath, squareFile)
    const key = `events/square/${match.slug}.jpg`
    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    if (match.square_image_url === publicUrl) {
      console.log(`  ALREADY SET ${match.slug}`)
      skipped++
      continue
    }

    console.log(`  ${DRY_RUN ? '[DRY] ' : ''}UPLOAD ${folder}/${squareFile} → ${key}`)

    if (!DRY_RUN) {
      const buffer = readFileSync(imagePath)
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        ContentLength: buffer.byteLength,
      }))

      await sql`update events set square_image_url = ${publicUrl} where id = ${match.id}`
      console.log(`    → set on "${match.title}" (${match.slug})`)
    }

    matched++
  }

  console.log(`\nDone. ${matched} uploaded/updated, ${skipped} skipped.`)
  if (DRY_RUN) console.log('(dry run — no changes written)')
}

main().catch(e => { console.error(e); process.exit(1) })
