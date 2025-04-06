'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface BuyTicketButtonProps {
  eventId: string
  price: number
  title?: string
}

export default function BuyTicketButton({ eventId, price, title }: BuyTicketButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [quantity, setQuantity] = useState("1")
  const router = useRouter()
  
  const handleBuyTicket = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          quantity: parseInt(quantity),
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-white">
          Quantity
        </Label>
        <Select
          value={quantity}
          onValueChange={setQuantity}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full bg-background/10 text-white border-gray-700 focus:ring-shameless-red">
            <SelectValue placeholder="Select quantity" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'ticket' : 'tickets'} (${(price * num).toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        onClick={handleBuyTicket}
        disabled={isLoading}
        variant="shameless"
        className="w-full py-6 text-lg rounded-full"
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Icons.ticket className="mr-2 h-5 w-5" />
            Buy {parseInt(quantity) > 1 ? `${quantity} tickets` : 'ticket'}
          </>
        )}
      </Button>
    </div>
  )
}
