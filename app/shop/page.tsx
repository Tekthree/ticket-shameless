import { Metadata } from 'next'
import { getProducts } from '@/lib/db'
import type { Product } from '@/lib/db'
import ShopClient from './ShopClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Merch — Simply Shameless',
  description: 'Official Simply Shameless merch. Tees, hoodies, hats and more.',
  alternates: { canonical: 'https://simplyshameless.com/shop' },
  openGraph: {
    title: 'Merch — Simply Shameless',
    description: 'Official Simply Shameless merch. Tees, hoodies, hats and more.',
    url: 'https://simplyshameless.com/shop',
    images: [{ url: '/images/merch/shameless_hoodie_og.jpg', width: 1200, alt: 'Simply Shameless merch — embroidered hoodie' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merch — Simply Shameless',
    description: 'Official Simply Shameless merch. Tees, hoodies, hats and more.',
    images: ['/images/merch/shameless_hoodie_og.jpg'],
  },
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
