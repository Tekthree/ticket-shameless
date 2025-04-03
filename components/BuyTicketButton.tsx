'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BuyTicketButtonProps {
  eventId: string
  price: number
  title?: string
}

export default function BuyTicketButton({ eventId, price, title }: BuyTicketButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
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
          quantity,
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
    <div>
      <div className="mb-4">
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
          Quantity
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          disabled={isLoading}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'ticket' : 'tickets'} (${(price * num).toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      
      <button
        onClick={handleBuyTicket}
        disabled={isLoading}
        className="w-full py-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : `Buy ${quantity > 1 ? `${quantity} tickets` : 'ticket'}`}
      </button>
    </div>
  )
}
