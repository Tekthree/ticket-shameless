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
        
        // Extract event ID from metadata
        const eventId = session.metadata?.eventId
        console.log('Event ID from metadata:', eventId)
        
        if (!eventId) {
          console.error('No event ID found in session metadata')
          return NextResponse.json({ error: 'Missing event ID in metadata' }, { status: 400 })
        }
        
        // Validate that the event ID is a valid UUID (important for foreign key constraint)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const isValidUuid = uuidRegex.test(eventId)
        
        if (!isValidUuid) {
          console.error(`Invalid event ID format: ${eventId} is not a valid UUID`)
          console.log('Will attempt to process order with null event_id')
        }
        
        // Get quantity from metadata or default to 1
        const quantity = parseInt(session.metadata?.quantity || '1')
        
        // Prepare order data
        const orderData = {
          event_id: isValidUuid ? eventId : null,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || 'unknown@example.com',
          customer_name: session.customer_details?.name || 'Unknown Customer',
          amount_total: session.amount_total ? session.amount_total / 100 : 0,
          status: 'completed',
          quantity: quantity
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
          
          // Now update the ticket count for the event
          if (isValidUuid) {
            console.log(`Attempting to update tickets for event: ${eventId}`)
            
            try {
              // First, get current tickets remaining
              const { data: eventData, error: fetchError } = await supabase
                .from('events')
                .select('tickets_remaining')
                .eq('id', eventId)
                .single()
              
              if (fetchError) {
                console.error('Error fetching event data:', fetchError)
                console.log('Will skip updating event ticket count due to error')
                // Don't fail the webhook, we've already recorded the order
              } else {
                // Calculate new tickets remaining
                const newTicketsRemaining = Math.max(0, eventData.tickets_remaining - quantity)
                const soldOut = newTicketsRemaining <= 0
                
                // Update the event
                const { error: eventError } = await supabase
                  .from('events')
                  .update({
                    tickets_remaining: newTicketsRemaining,
                    sold_out: soldOut
                  })
                  .eq('id', eventId)
                
                if (eventError) {
                  console.error('Error updating event ticket count:', eventError)
                  console.log('Order was recorded, but ticket count update failed')
                } else {
                  console.log(`Updated event ${eventId}: tickets_remaining=${newTicketsRemaining}, sold_out=${soldOut}`)
                }
              }
            } catch (eventUpdateError) {
              console.error('Error during event update process:', eventUpdateError)
              console.log('Order was recorded, but event update failed')
            }
          } else {
            console.log('Skipping event update because event ID is not a valid UUID')
          }
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
