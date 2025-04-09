'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUserProfile } from '@/hooks/useUserProfile'

interface BuyTicketButtonProps {
  eventId: string
  price: number
  title?: string
}

export default function BuyTicketButton({ eventId, price, title }: BuyTicketButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [quantity, setQuantity] = useState("1")
  const [email, setEmail] = useState("")
  const [showEmailInput, setShowEmailInput] = useState(false)
  const router = useRouter()
  const { profile, isLoading: isLoadingProfile } = useUserProfile()
  
  const handleBuyTicket = async () => {
    // If email collection is shown but not filled out, validate it first
    if (showEmailInput && !profile) {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address')
        return
      }
      
      // Store email in localStorage for later use
      localStorage.setItem('lastPurchaseEmail', email)
    }
    
    // If user is logged in, use their profile email
    if (profile) {
      setEmail(profile.email)
    }
    
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
          email: profile ? profile.email : email || undefined, // Use profile email if logged in
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
  
  // Show email input instead of proceeding directly to checkout
  const handleProceed = () => {
    // Skip email input if user is logged in
    if (profile) {
      handleBuyTicket()
    } else {
      setShowEmailInput(true)
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
          disabled={isLoading || showEmailInput}
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
      
      {showEmailInput && !profile ? (
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">
            Email for ticket confirmation
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="bg-background/10 text-white border-gray-700 focus:ring-shameless-red"
            disabled={isLoading}
            autoFocus
          />
          <p className="text-xs text-gray-400">Your tickets will be sent to this email</p>
        </div>
      ) : profile ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">Tickets will be sent to:</p>
          <p className="text-white font-medium">{profile.email}</p>
        </div>
      ) : null}
      
      <Button
        onClick={showEmailInput ? handleBuyTicket : handleProceed}
        disabled={isLoading}
        variant="shameless"
        className="w-full py-6 text-lg rounded-full"
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : showEmailInput ? (
          <>
            <Icons.ticket className="mr-2 h-5 w-5" />
            Continue to Payment
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
