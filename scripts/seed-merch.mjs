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

// Ensure products table exists
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
console.log('✓ products table ready')

const items = [
  {
    name: 'Shameless Tee — Black',
    description: 'Classic fit, heavyweight cotton. Screen printed logo on chest.',
    price: 35,
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 50,
  },
  {
    name: 'Shameless Tee — White',
    description: 'Classic fit, heavyweight cotton. Screen printed logo on chest.',
    price: 35,
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 50,
  },
  {
    name: 'Shameless Hoodie',
    description: 'Pullover hoodie, 80% cotton 20% poly. Embroidered logo on chest.',
    price: 75,
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
  },
  {
    name: 'Dad Hat — Washed Black',
    description: 'Unstructured 6-panel cap with adjustable strap. Embroidered logo.',
    price: 32,
    category: 'accessories',
    sizes: ['One Size'],
    stock: 40,
  },
  {
    name: 'Sticker Pack (5)',
    description: 'Five die-cut vinyl stickers. UV-resistant, waterproof.',
    price: 10,
    category: 'accessories',
    sizes: null,
    stock: 200,
  },
]

for (const item of items) {
  await sql`
    insert into products (name, description, price, category, sizes, stock)
    values (${item.name}, ${item.description}, ${item.price}, ${item.category}, ${item.sizes}, ${item.stock})
    on conflict do nothing
  `
  console.log(`✓ ${item.name}`)
}

console.log('\nDone. Products seeded.')
