import dotenv from 'dotenv'

dotenv.config({ path: '.env.local', quiet: true })
const secret = process.env.CACHE_REVALIDATION_SECRET
if (!secret) throw new Error('Set CACHE_REVALIDATION_SECRET before refreshing content')
const url = new URL('/api/revalidate', process.env.SITE_URL || 'https://www.simplyshameless.com')
const response = await fetch(url, {
  method: 'POST',
  headers: { authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(30000),
})
if (!response.ok) throw new Error(`Content refresh failed (${response.status})`)
console.log('Content caches invalidated. Pages will refresh on their next request.')
