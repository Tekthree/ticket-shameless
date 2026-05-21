import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function checkData() {
  console.log('--- HollyLouYah ---')
  const holly = await sql`SELECT id, name, bio FROM djs WHERE name ILIKE '%holly%'`
  console.log(holly)

  console.log('\n--- Check the Volume ---')
  const event = await sql`SELECT id, title, venue FROM events WHERE title ILIKE '%volume%'`
  console.log(event)
}

checkData().catch(console.error)
