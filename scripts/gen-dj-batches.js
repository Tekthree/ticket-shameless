const fs = require('fs')
const env = fs.readFileSync('/tmp/shameless-env', 'utf8')
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL'))?.split(/=(.+)/)[1]?.trim().replace(/^"|"$/g, '')
const { neon } = require('@neondatabase/serverless')
const sql = neon(dbUrl)

const offset = parseInt(process.argv[2] || '225', 10)
const startBatch = parseInt(process.argv[3] || '9', 10)

sql`select slug, name, location, ra_url, instagram_url, soundcloud_url, bio from djs where is_published = true order by name asc offset ${offset} limit 75`.then(rows => {
  for (let i = 0; i < 3; i++) {
    fs.writeFileSync('/tmp/dj-batch-' + (startBatch + i) + '.json', JSON.stringify(rows.slice(i * 25, i * 25 + 25), null, 2))
  }
  console.log('done', rows.length)
}).catch(console.error)
