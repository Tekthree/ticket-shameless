import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'
import type { Product } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' })

export async function POST(req: NextRequest) {
  try {
    const { productId, size } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const rows = await sql`select * from products where id = ${productId} and is_published = true limit 1`
    const product = rows[0] as Product | undefined

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    if (product.stock === 0) {
      return NextResponse.json({ error: 'Out of stock' }, { status: 409 })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(product.price * 100),
            product_data: {
              name: product.name + (size ? ` — ${size}` : ''),
              description: product.description ?? undefined,
              images: product.image_url ? [product.image_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_id: product.id,
        size: size ?? '',
      },
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 })
  }
}
