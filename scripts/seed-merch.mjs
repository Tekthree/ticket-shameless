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

// Clear old products to avoid duplicates and show only the new merch line
await sql`delete from products`
console.log('✓ products table cleared')

const items = [
  {
    name: 'Shameless Visor Pendant Chain',
    description: 'Custom brushed steel circular pendant engraved with the official Shameless DJ visor design. Attached to a premium silver barrel ball chain. Limited run.',
    price: 45.00,
    image_url: '/images/merch/shameless_chain.png',
    category: 'Accessories',
    sizes: ['One Size'],
    stock: 100,
  },
  {
    name: 'Shameless Visor Tee - Black',
    description: 'Heavyweight 100% cotton streetwear t-shirt in washed black. Features a screen-printed circular DJ visor graphic on the chest. Classic boxy fit.',
    price: 35.00,
    image_url: '/images/merch/shameless_black_tee.png',
    category: 'Tops',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    stock: 75,
  },
]

for (const item of items) {
  await sql`
    insert into products (name, description, price, image_url, category, sizes, stock)
    values (${item.name}, ${item.description}, ${item.price}, ${item.image_url}, ${item.category}, ${item.sizes}, ${item.stock})
  `
  console.log(`✓ Seeded product: ${item.name}`)
}

console.log('\nDone. Products seeded.')
