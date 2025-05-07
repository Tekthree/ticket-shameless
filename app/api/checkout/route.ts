import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2022-11-15',
})

export async function POST(request: Request) {
  try {
    const { eventId, quantity = 1, email } = await request.json()
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    // Validate email if provided and user is not authenticated
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

    // Get the authenticated user if available
    const user = await getAuthenticatedUser()
    const userId = user?.id || null
    
    // Determine the correct email to use
    // If user is authenticated, always use their email from the auth system
    // Otherwise use the provided email from the request
    const customerEmail = user?.email || email
    
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${event.slug}?success=true&email=${encodeURIComponent(customerEmail || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${event.slug}?canceled=true`,
      metadata: {
        eventId: event.id,
        eventSlug: event.slug,
        quantity: quantity.toString(),
        customerEmail: customerEmail || '', // Use the determined email
        userId: userId || '', // Store user ID in metadata if available
      },
      // Store client reference ID for better tracking
      client_reference_id: userId || undefined,
      // Add these lines to collect customer information
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      customer_email: customerEmail, // Use the determined email
      locale: 'en', // Use English locale
      // Default to United States
      shipping_address_collection: {
        allowed_countries: ['US'],
      }
    })

    // Temporarily decrement ticket count to prevent overselling
    // The final update will be done by the webhook/trigger
    const { error: updateError } = await supabase
      .from('events')
      .update({
        tickets_remaining: Math.max(0, event.tickets_remaining - quantity),
        sold_out: event.tickets_remaining - quantity <= 0
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Warning: Failed to temporarily update ticket count:', updateError)
      // Continue anyway as the webhook will handle the final update
    }
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' }, 
      { status: 500 }
    )
  }
}