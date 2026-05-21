import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function updateAivilo() {
  console.log('Updating Aivilo Instagram URL...')
  const result = await sql`
    UPDATE djs 
    SET instagram_url = 'https://www.instagram.com/aivilo.b2b.olivia/'
    WHERE name ILIKE '%aivilo%'
    RETURNING id, name, instagram_url
  `
  console.log('Updated DB:', result)
}

updateAivilo().catch(console.error)
