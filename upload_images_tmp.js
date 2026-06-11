const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs'), crypto = require('crypto'), https = require('https'), http = require('http')

const r2Env = fs.readFileSync('/tmp/r2-env', 'utf8')
const getR2 = k => r2Env.split('\n').find(l => l.startsWith(k+'='))?.split(/=(.+)/)[1]?.trim() || ''
const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://' + getR2('R2_ACCOUNT_ID') + '.r2.cloudflarestorage.com',
  credentials: { accessKeyId: getR2('R2_ACCESS_KEY_ID'), secretAccessKey: getR2('R2_SECRET_ACCESS_KEY') }
})

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const get = (u) => {
      const mod = u.startsWith('https') ? https : http
      mod.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if ([301,302,303,307,308].includes(res.statusCode)) { get(res.headers.location); return }
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve() })
      }).on('error', reject)
    }
    get(url)
  })
}

// DJs that need images - using RA image URLs from GraphQL
const djs = [
  { slug: 'bexfromchicago', imageUrl: 'https://static.ra.co/images/profiles/square/bexfromchicago.jpg?dateUpdated=1742949874000' },
  { slug: 'clarian', imageUrl: 'https://static.ra.co/images/profiles/square/clarian.jpg?dateUpdated=1778520053867' },
  { slug: 'creach-live', imageUrl: 'https://static.ra.co/images/profiles/square/creach.jpg?dateUpdated=1765955654260' },
  { slug: 'ctrl-mp3', imageUrl: 'https://static.ra.co/images/profiles/square/ctrl.mp3.jpg?dateUpdated=1780212644997' },
  { slug: 'dj-essex', imageUrl: 'https://static.ra.co/images/profiles/essex.jpg?dateUpdated=1452625013487' },
  { slug: 'dj-heather', imageUrl: 'https://static.ra.co/images/profiles/djheather.jpg?dateUpdated=1187272638407' },
  { slug: 'dj-manos', imageUrl: 'https://static.ra.co/images/profiles/manos.jpg?dateUpdated=1355961409000' },
  { slug: 'dj-sh1-tr', imageUrl: 'https://static.ra.co/images/profiles/square/djsh1-tr.jpg?dateUpdated=1539876377000' },
  { slug: 'dj-sloth', imageUrl: 'https://static.ra.co/images/profiles/square/djsloth.jpg?dateUpdated=1673257345000' },
  { slug: 'dj-zen', imageUrl: 'https://static.ra.co/images/profiles/square/dj.zen.jpg?dateUpdated=1742949820000' },
  { slug: 'dance-spirit', imageUrl: 'https://static.ra.co/images/profiles/square/dancespirit.jpg?dateUpdated=1456958472387' },
  { slug: 'danny-daze', imageUrl: 'https://static.ra.co/images/profiles/dannydaze.jpg?dateUpdated=1590710400000' },
  { slug: 'dave-dk', imageUrl: 'https://static.ra.co/images/profiles/davedk.jpg?dateUpdated=1559549477000' },
  { slug: 'dave-nada', imageUrl: 'https://static.ra.co/images/profiles/davenada.jpg?dateUpdated=1307383056000' },
  { slug: 'dewalta', imageUrl: 'https://static.ra.co/images/profiles/dewalta.jpg?dateUpdated=1408610890290' },
  { slug: 'death-on-the-balcony', imageUrl: 'https://static.ra.co/images/profiles/deathonthebalcony.jpg?dateUpdated=1486221180040' },
]

async function uploadDJ(dj) {
  const tmpPath = '/tmp/dj-img-' + dj.slug + '.jpg'
  try {
    await download(dj.imageUrl, tmpPath)
    const stats = fs.statSync(tmpPath)
    if (stats.size < 5000) {
      console.log(`SKIP_SMALL: ${dj.slug} (${stats.size} bytes)`)
      fs.unlinkSync(tmpPath)
      return
    }
    const hash = crypto.randomBytes(4).toString('hex')
    const key = 'djs/' + dj.slug + '-' + hash + '.jpg'
    await r2.send(new PutObjectCommand({
      Bucket: 'shameless-party-images',
      Key: key,
      Body: fs.readFileSync(tmpPath),
      ContentType: 'image/jpeg'
    }))
    fs.unlinkSync(tmpPath)
    console.log(`UPLOADED: ${dj.slug} -> https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/${key}`)
  } catch (err) {
    console.log(`ERROR: ${dj.slug} -> ${err.message}`)
    try { fs.unlinkSync(tmpPath) } catch(e) {}
  }
}

async function run() {
  for (const dj of djs) {
    await uploadDJ(dj)
  }
}

run()
