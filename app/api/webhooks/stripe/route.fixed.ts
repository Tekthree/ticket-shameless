import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Stripe from 'stripe'

// Initialize the Stripe client with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2022-11-15',
})

// This is your Stripe CLI webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'

export async function POST(request: Request) {
  // Log that we received a webhook request
  console.log('⭐ Stripe webhook received - starting processing')
  
  const payload = await request.text()
  const sig = headers().get('Stripe-Signature') || ''
  
  let event: Stripe.Event
  
  try {
    // Log webhook details for debugging
    console.log(`Webhook received: Signature: ${sig ? 'Present' : 'Missing'}, Secret: ${endpointSecret ? 'Present' : 'Missing'}`)
    console.log(`Webhook payload length: ${payload.length} characters`)
    
    // Log the event type from the payload
    try {
      const payloadObj = JSON.parse(payload)
      console.log(`Event type from payload: ${payloadObj.type}`)
    } catch (e) {
      console.log('Could not parse payload JSON')
    }
    
    // Verify the event came from Stripe using the webhook secret
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err) {
    const error = err as Error
    console.error(`⚠️  Webhook signature verification failed: ${error.message}`)
    console.error(`⚠️  Check that STRIPE_WEBHOOK_SECRET is correctly set in your environment variables`)
    return NextResponse.json({ error: `Webhook signature verification failed: ${error.message}` }, { status: 400 })
  }
  
  console.log(`✅ Success: Received Stripe webhook: ${event.type}`)
  
  // Handle the event based on its type
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`🛒 Checkout session completed: ${session.id}`)
        
        // Initialize Supabase client FIRST, before using it
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        console.log('Environment check:', {
          supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
          serviceKey: supabaseServiceKey ? `Present (${supabaseServiceKey.substring(0, 5)}...)` : 'Missing'
        })
        
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('Missing Supabase URL or service key in environment variables')
          return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
        }
        
        // Create a supabase admin client with the service role key for webhook operations
        let supabase
        try {
          supabase = createServerClient(
            supabaseUrl,
            supabaseServiceKey,
            {
              cookies: {
                get: () => undefined,
                set: () => {},
                remove: () => {}
              }
            }
          )
          console.log('Supabase client initialized successfully')
        } catch (supabaseInitError) {
          console.error('Failed to initialize Supabase client:', supabaseInitError)
          return NextResponse.json({ error: 'Database client initialization failed' }, { status: 500 })
        }
        
        // SIMPLIFIED ORDER DATA - just the essentials for testing
        const orderData = {
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || 'unknown@example.com',
          customer_name: session.customer_details?.name || 'Unknown Customer',
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
          status: 'completed',
          quantity: 1
        }
        
        console.log('Attempting to insert order with data:', orderData)
        
        // Insert the order record
        try {
          const { data: insertData, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
          
          if (orderError) {
            console.error('Error recording order:', orderError)
            return NextResponse.json({ error: 'Failed to record order' }, { status: 500 })
          }
          
          console.log('Order recorded successfully:', insertData)
        } catch (insertError) {
          console.error('Exception during order insertion:', insertError)
          return NextResponse.json({ error: 'Exception during order insertion' }, { status: 500 })
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
