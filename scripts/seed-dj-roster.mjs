/**
 * Seed all DJ profiles from scripts/data/dj-roster.json
 *
 * Sources:
 *   scripts/data/dj-roster.json        — 190 DJs from the Shameless DJ Roster sheet
 *   scripts/data/dj-alias-map.json     — billing name → canonical slug map (A–J, 356 entries)
 *   scripts/data/dj-merge-aliases.json — 16 aliases from the duplicate/merge log
 *
 * For each DJ:
 *   - Upserts name, slug, bio, location, social URLs, is_resident, aliases
 *   - Fetches profile image and uploads to R2 (falls back to sheet URL on failure)
 *
 * Run: node scripts/seed-dj-roster.mjs
 * Safe to re-run — uses ON CONFLICT DO UPDATE.
 */

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvConfig(join(__dirname, '..'))

const DATABASE_URL = process.env.DATABASE_URL
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

const sql = neon(DATABASE_URL)

// Load data files
const roster = JSON.parse(readFileSync(join(__dirname, 'data/dj-roster.json'), 'utf8'))
const aliasMap = JSON.parse(readFileSync(join(__dirname, 'data/dj-alias-map.json'), 'utf8'))
const mergeAliases = JSON.parse(readFileSync(join(__dirname, 'data/dj-merge-aliases.json'), 'utf8'))

// Build aliases per canonical slug from both sources
function buildAliasMap() {
  const bySlug = {}

  // From merge/dedupe log
  for (const { canonical_name, alias_name } of mergeAliases) {
    const slug = toSlug(canonical_name)
    if (!bySlug[slug]) bySlug[slug] = new Set()
    bySlug[slug].add(alias_name)
  }

  // From alias map (non-canonical, non-composite single-DJ entries)
  for (const entry of aliasMap) {
    if (entry.is_composite) continue
    if (entry.match_type === 'canonical') continue
    const slug = entry.canonical_slugs[0]
    if (!slug) continue
    if (!bySlug[slug]) bySlug[slug] = new Set()
    bySlug[slug].add(entry.alias)
  }

  return bySlug
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function fetchAndUpload(imageUrl, slug) {
  if (!imageUrl) return null
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const key = `djs/${slug}-${randomUUID().slice(0, 8)}.${ext}`
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.byteLength,
    }))
    return `${R2_PUBLIC_URL}/${key}`
  } catch (e) {
    return null
  }
}

// Check which slugs already have R2 images so we skip re-uploading
const existing = await sql`SELECT slug, profile_image_url FROM djs`
const existingR2 = new Set(
  existing
    .filter(r => r.profile_image_url?.includes('r2.dev'))
    .map(r => r.slug)
)

const aliasesBySlug = buildAliasMap()

console.log(`Seeding ${roster.length} DJs...\n`)

let inserted = 0, updated = 0, imgUploaded = 0, imgFailed = 0

for (const dj of roster) {
  const slug = dj['Slug'] || toSlug(dj['DJ Names'])
  const name = dj['DJ Names']
  const bio = dj['Bio'] || null
  const location = dj['Location'] || null
  const isResident = dj['Resident'] === 'Yes'
  const instagram = dj['Instagram'] || null
  const soundcloud = dj['SoundCloud'] || null
  const spotify = dj['Spotify'] || null
  const youtube = dj['YouTube'] || null
  const mixcloud = dj['Mixcloud'] || null
  const website = dj['Website'] || null
  const sheetImageUrl = dj['Profile Image URL'] || null

  const aliases = Array.from(aliasesBySlug[slug] || [])

  // Upload image to R2 if not already there
  let profileImageUrl = null
  if (existingR2.has(slug)) {
    // Keep existing R2 image
    profileImageUrl = existing.find(r => r.slug === slug)?.profile_image_url
  } else if (sheetImageUrl) {
    const r2Url = await fetchAndUpload(sheetImageUrl, slug)
    if (r2Url) {
      profileImageUrl = r2Url
      imgUploaded++
      process.stdout.write(`  [img OK] ${name}\n`)
    } else {
      profileImageUrl = sheetImageUrl // fall back to original
      imgFailed++
      process.stdout.write(`  [img fallback] ${name}\n`)
    }
  }

  const rows = await sql`
    INSERT INTO djs (slug, name, bio, location, is_resident, aliases,
      instagram_url, soundcloud_url, spotify_url, youtube_url, mixcloud_url, website_url,
      profile_image_url, is_published)
    VALUES (
      ${slug}, ${name}, ${bio}, ${location}, ${isResident}, ${aliases},
      ${instagram}, ${soundcloud}, ${spotify}, ${youtube}, ${mixcloud}, ${website},
      ${profileImageUrl}, true
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      bio = COALESCE(EXCLUDED.bio, djs.bio),
      location = COALESCE(EXCLUDED.location, djs.location),
      is_resident = EXCLUDED.is_resident,
      aliases = EXCLUDED.aliases,
      instagram_url = COALESCE(EXCLUDED.instagram_url, djs.instagram_url),
      soundcloud_url = COALESCE(EXCLUDED.soundcloud_url, djs.soundcloud_url),
      spotify_url = COALESCE(EXCLUDED.spotify_url, djs.spotify_url),
      youtube_url = COALESCE(EXCLUDED.youtube_url, djs.youtube_url),
      mixcloud_url = COALESCE(EXCLUDED.mixcloud_url, djs.mixcloud_url),
      website_url = COALESCE(EXCLUDED.website_url, djs.website_url),
      profile_image_url = COALESCE(EXCLUDED.profile_image_url, djs.profile_image_url)
    RETURNING (xmax = 0) AS is_new
  `

  if (rows[0]?.is_new) inserted++
  else updated++
}

console.log(`\nDone.`)
console.log(`  Inserted: ${inserted} | Updated: ${updated}`)
console.log(`  Images uploaded to R2: ${imgUploaded} | Fell back to sheet URL: ${imgFailed}`)
