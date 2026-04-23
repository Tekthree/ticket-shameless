import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf8')
const dbMatch = envFile.match(/^DATABASE_URL=(.+)$/m)
if (!dbMatch) { console.error('DATABASE_URL not found'); process.exit(1) }
const DATABASE_URL = dbMatch[1].trim().replace(/^["']|["']$/g, '')

const sql = neon(DATABASE_URL)

const tony = {
  slug: 'tony-h',
  name: 'Tony H',
  bio: `Panamanian-born, Seattle-based DJ, producer, and label owner. Known for tech house, deep house, and techno — groove-driven rhythms and acid-tinged basslines built for the dancefloor.

Founder of Late Night Munchies (2015) and its darker sub-label Munchies After Dark (2019). Released on Desert Hearts, Dirtybird, Flashmob Records, Farris Wheel Recordings, Space Yacht, and more. Regular fixture at The Monkey Loft and Kremwerk. Festival credits include Day Trip, Bass Coast, and Miami Music Week.

Named an artist to watch by Kevin Knapp and featured in Gray Area Magazine's "10 Rising Black Artists You Should Know."`,
  location: 'Seattle, WA',
  genres: ['Tech House', 'Deep House', 'Techno'],
  soundcloud_url: 'https://www.soundcloud.com/dj-tonyh',
  instagram_url: 'https://www.instagram.com/djtonyh507',
  website_url: 'http://linktr.ee/officialtonyh',
  seo_description: 'Tony H is a Panamanian-born, Seattle-based DJ, producer, and label owner specializing in tech house, deep house, and techno. Founder of Late Night Munchies. Regular at Simply Shameless events.',
  is_published: true,
}

const rows = await sql`
  insert into djs (slug, name, bio, location, genres, soundcloud_url, instagram_url, website_url, seo_description, is_published)
  values (
    ${tony.slug}, ${tony.name}, ${tony.bio}, ${tony.location},
    ${tony.genres}, ${tony.soundcloud_url}, ${tony.instagram_url},
    ${tony.website_url}, ${tony.seo_description}, ${tony.is_published}
  )
  on conflict (slug) do update set
    name = excluded.name,
    bio = excluded.bio,
    location = excluded.location,
    genres = excluded.genres,
    soundcloud_url = excluded.soundcloud_url,
    instagram_url = excluded.instagram_url,
    website_url = excluded.website_url,
    seo_description = excluded.seo_description
  returning id, slug, name
`

console.log('Inserted:', rows[0])
