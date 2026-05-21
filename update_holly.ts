import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function updateDb() {
  const result = await sql`
    UPDATE djs 
    SET profile_image_url = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/djs/hollylouyah_1778786951748.jpg'
    WHERE name ILIKE '%HollyLouYah%'
    RETURNING id, name, profile_image_url
  `
  console.log('Updated DB:', result)
}

updateDb().catch(console.error)
