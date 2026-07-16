import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

const [djStats] = await sql`SELECT COUNT(*) as total, SUM(CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END)::int as with_bio, SUM(CASE WHEN seo_description IS NOT NULL THEN 1 ELSE 0 END)::int as with_seo_desc FROM djs`
const [eventStats] = await sql`SELECT COUNT(*) as total, SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END)::int as with_desc FROM events`
const [thinDJs] = await sql`SELECT COUNT(*) as thin_dj_count FROM djs WHERE (bio IS NULL OR bio = '') AND (seo_description IS NULL)`
const sampleDJs = await sql`SELECT name, slug, bio, seo_description FROM djs WHERE bio IS NOT NULL AND bio != '' LIMIT 3`
const noDescEvents = await sql`SELECT title, slug FROM events WHERE description IS NULL OR description = '' ORDER BY date DESC LIMIT 5`

console.log('=== DJ STATS ===')
console.log(JSON.stringify(djStats, null, 2))
console.log('\n=== EVENT STATS ===')
console.log(JSON.stringify(eventStats, null, 2))
console.log('\n=== THIN DJ PAGES (no bio, no seo_description) ===')
console.log(JSON.stringify(thinDJs, null, 2))
console.log('\n=== SAMPLE DJ BIOS ===')
sampleDJs.forEach(d => console.log(`  ${d.name}: bio=${d.bio?.length ?? 0}chars, seo_desc=${d.seo_description?.length ?? 0}chars`))
console.log('\n=== EVENTS WITHOUT DESCRIPTION ===')
noDescEvents.forEach(e => console.log(`  ${e.title} (/events/${e.slug})`))
