import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'
import type { Product } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, size, cartItems } = body

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const cartMetadata: Array<{ id: string; qty: number; size: string }> = []

    const getAbsoluteImageUrl = (url: string | null) => {
      if (!url) return []
      if (url.startsWith('http')) return [url]
      return [`${origin}${url}`]
    }

    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      // Multi-item cart checkout
      for (const item of cartItems) {
        const rows = await sql`select * from products where id = ${item.id} and is_published = true limit 1`
        const product = rows[0] as Product | undefined

        if (!product) {
          return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 404 })
        }
        if (product.stock < item.qty) {
          return NextResponse.json({ error: `${product.name} is out of stock or quantity exceeds stock` }, { status: 409 })
        }

        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(product.price * 100),
            product_data: {
              name: product.name + (item.size && item.size !== 'One Size' ? ` — ${item.size}` : ''),
              description: product.description ?? undefined,
              images: getAbsoluteImageUrl(product.image_url),
            },
          },
          quantity: item.qty,
        })
        cartMetadata.push({ id: product.id, qty: item.qty, size: item.size ?? 'One Size' })
      }
    } else {
      // Single-item "Buy Now" checkout (backward compatibility)
      if (!productId) {
        return NextResponse.json({ error: 'productId or cartItems required' }, { status: 400 })
      }

      const rows = await sql`select * from products where id = ${productId} and is_published = true limit 1`
      const product = rows[0] as Product | undefined

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      if (product.stock === 0) {
        return NextResponse.json({ error: 'Out of stock' }, { status: 409 })
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name + (size && size !== 'One Size' ? ` — ${size}` : ''),
            description: product.description ?? undefined,
            images: getAbsoluteImageUrl(product.image_url),
          },
        },
        quantity: 1,
      })
      cartMetadata.push({ id: product.id, qty: 1, size: size ?? 'One Size' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        cart: JSON.stringify(cartMetadata).slice(0, 500),
        product_id: cartMetadata.length === 1 ? cartMetadata[0].id : '',
        size: cartMetadata.length === 1 ? cartMetadata[0].size : '',
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
