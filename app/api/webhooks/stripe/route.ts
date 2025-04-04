import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Initialize the Stripe client with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
})

// This is your Stripe CLI webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'

export async function POST(request: Request) {
  const payload = await request.text()
  const sig = headers().get('Stripe-Signature') || ''
  
  let event: Stripe.Event
  
  try {
    // Verify the event came from Stripe using the webhook secret
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err) {
    const error = err as Error
    console.error(`⚠️  Webhook signature verification failed: ${error.message}`)
    return NextResponse.json({ error: `Webhook signature verification failed: ${error.message}` }, { status: 400 })
  }
  
  console.log(`✅ Success: Received Stripe webhook: ${event.type}`)
  
  // Handle the event based on its type
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`💰 PaymentIntent successful: ${paymentIntent.id}`)
        // You might want to fulfill the order here
        break
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`❌ PaymentIntent failed: ${failedPaymentIntent.id}`)
        break
        
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`🛒 Checkout session completed: ${session.id}`)
        
        // Extract necessary information
        const eventId = session.metadata?.eventId
        
        if (!eventId) {
          console.error('No event ID found in session metadata')
          return NextResponse.json({ error: 'Missing event ID in metadata' }, { status: 400 })
        }
        
        // Record the order in Supabase using admin rights to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        
        // Create a supabase client with the service role key
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            event_id: eventId,
            stripe_session_id: session.id,
            customer_email: session.customer_details?.email,
            customer_name: session.customer_details?.name,
            amount_total: session.amount_total ? session.amount_total / 100 : 0,
            status: 'completed',
            quantity: parseInt(session.metadata?.quantity || '1'),
          })
        
        if (orderError) {
          console.error('Error recording order:', orderError)
          return NextResponse.json({ error: 'Failed to record order' }, { status: 500 })
        }
        
        // Update ticket count for the event
        const quantity = parseInt(session.metadata?.quantity || '1')
        const { error: eventError } = await supabase
          .from('events')
          .update({
            tickets_remaining: supabase.rpc('decrement', { 
              row_id: eventId,
              amount: quantity
            })
          })
          .eq('id', eventId)
        
        if (eventError) {
          console.error('Error updating event ticket count:', eventError)
          return NextResponse.json({ error: 'Failed to update ticket count' }, { status: 500 })
        }
        
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
  
  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true })
}
