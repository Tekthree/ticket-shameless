import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function removeSocials() {
  console.log('Removing social links for Moist Towelette...')
  const result = await sql`
    UPDATE djs 
    SET soundcloud_url = NULL,
        instagram_url = NULL
    WHERE name ILIKE '%Moist Towelette%'
    RETURNING id, name, soundcloud_url, instagram_url
  `
  console.log('Updated DB:', result)
}

removeSocials().catch(console.error)
