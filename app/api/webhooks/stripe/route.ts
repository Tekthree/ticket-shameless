import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const cartStr = session.metadata?.cart

    if (cartStr) {
      try {
        const items = JSON.parse(cartStr) as Array<{ id: string; qty: number; size: string }>
        for (const item of items) {
          await sql`
            update products
            set stock = greatest(stock - ${item.qty}, 0)
            where id = ${item.id}
          `
        }
      } catch (err) {
        console.error('Failed to parse cart metadata or decrement stock:', err)
      }
    } else {
      // Fallback for single-item metadata
      const productId = session.metadata?.product_id
      if (productId) {
        try {
          await sql`
            update products
            set stock = greatest(stock - 1, 0)
            where id = ${productId}
          `
        } catch (err) {
          console.error('Failed to decrement stock:', err)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
