import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] })
    .filter(([k]) => k)
)

const sql = neon(env.DATABASE_URL)

console.log('Running migrations...\n')

// events
await sql`
  create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    description text,
    date timestamptz not null,
    end_date timestamptz,
    venue text,
    address text,
    image_url text,
    tags text[] default '{}',
    payment_link text,
    suggested_price numeric(10,2),
    is_public boolean not null default true,
    is_published boolean not null default true,
    ticket_tiers jsonb,
    created_at timestamptz not null default now()
  )
`
console.log('✓ events')

// lineup
await sql`
  create table if not exists lineup (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    name text not null,
    bio text,
    image_url text,
    mix_url text,
    time_slot text,
    sort_order integer not null default 0,
    stage text
  )
`
console.log('✓ lineup')

// rsvps
await sql`
  create table if not exists rsvps (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references events(id) on delete cascade,
    name text not null,
    email text,
    phone text,
    status text not null default 'going',
    note text,
    created_at timestamptz not null default now(),
    unique (event_id, email)
  )
`
console.log('✓ rsvps')

// products
await sql`
  create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price numeric(10,2) not null,
    image_url text,
    category text,
    sizes text[],
    stock integer not null default 0,
    is_published boolean not null default true,
    stripe_price_id text,
    created_at timestamptz not null default now()
  )
`
console.log('✓ products')

// subscribers
await sql`
  create table if not exists subscribers (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    name text,
    subscribed_at timestamptz not null default now()
  )
`
console.log('✓ subscribers')

console.log('\nAll migrations complete.')
