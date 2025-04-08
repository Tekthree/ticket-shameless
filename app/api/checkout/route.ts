import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2022-11-15',
})

export async function POST(request: Request) {
  try {
    const { eventId, quantity = 1 } = await request.json()
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Get event details
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    
    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Check if enough tickets are available
    if (event.tickets_remaining < quantity) {
      return NextResponse.json(
        { error: 'Not enough tickets available' }, 
        { status: 400 }
      )
    }
    
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: event.title,
              description: `Event date: ${new Date(event.date).toLocaleDateString()}`,
              images: event.image ? [event.image] : [],
            },
            unit_amount: Math.round(event.price * 100), // Stripe expects cents
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${event.slug}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${event.slug}?canceled=true`,
      metadata: {
        eventId: event.id,
        eventSlug: event.slug,
        quantity: quantity.toString(),
      },
    })
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' }, 
      { status: 500 }
    )
  }
}