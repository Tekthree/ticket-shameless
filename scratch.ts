import { sql } from './lib/db'

async function run() {
  const res = await sql`SELECT id, name, image_url FROM djs WHERE name ILIKE '%Holly%'`
  console.log(res)
}

run()
