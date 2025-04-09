'use client'

import { useEffect, useState } from 'react'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PurchaseSuccessProps {
  eventSlug: string
  eventTitle: string
}

export default function PurchaseSuccess({ eventSlug, eventTitle }: PurchaseSuccessProps) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  
  // Try to retrieve the customer email from localStorage if it was saved during checkout
  useEffect(() => {
    const storedEmail = localStorage.getItem('lastPurchaseEmail')
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [])
  
  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-6 border border-gray-800 max-w-md mx-auto my-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Icons.check className="h-8 w-8 text-green-500" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
      <p className="text-gray-400 mb-6">
        Thank you for purchasing tickets to {eventTitle}.
      </p>
      
      {email && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-300 mb-1">Confirmation sent to:</p>
          <p className="font-medium">{email}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push(`/events/${eventSlug}`)}
        >
          Back to Event
        </Button>
        
        <Button 
          variant="shameless" 
          className="w-full"
          onClick={() => router.push('/events')}
        >
          Browse More Events
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-6">
        If you have any questions about your order, please contact us at support@example.com
      </p>
    </div>
  )
}
