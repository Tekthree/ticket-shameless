import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function updateHolly() {
  const newBio = 'Seattle DJ and co-host of the Check the Volume weekly Twitch livestream party. Known for indie dance and house music. A longtime fixture in the Seattle electronic music scene with Shameless.'

  console.log('Updating HollyLouYah bio...')
  const result = await sql`
    UPDATE djs 
    SET bio = ${newBio}
    WHERE name ILIKE '%HollyLouYah%'
    RETURNING id, name, bio
  `
  console.log('Updated DB:', result)
}

updateHolly().catch(console.error)
