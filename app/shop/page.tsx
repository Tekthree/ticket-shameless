import { Metadata } from 'next'
import { getProducts } from '@/lib/db'
import type { Product } from '@/lib/db'
import ShopClient from './ShopClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Merch — Simply Shameless',
  description: 'Official Simply Shameless merch. Tees, hoodies, hats and more.',
}

export default async function ShopPage() {
  let products: Product[] = []
  try {
    products = await getProducts()
  } catch {
    // DB unavailable — renders with empty state
  }

  return <ShopClient products={products} />
}
