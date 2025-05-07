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
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client'

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
  
  // Check authentication status on component mount and clear any stored email
  useEffect(() => {
    const checkAuthAndClearEmail = async () => {
      const user = await getAuthenticatedUser()
      
      // If user is not authenticated, clear any stored email
      if (!user) {
        // Clear from both localStorage (legacy) and sessionStorage (new approach)
        localStorage.removeItem('lastPurchaseEmail')
        sessionStorage.removeItem('purchaseEmail')
        setEmail('')
      }
    }
    
    checkAuthAndClearEmail()
  }, [])
  
  const handleBuyTicket = async () => {
    // If email collection is shown but not filled out, validate it first
    if (showEmailInput && !profile) {
      if (!email || !email.includes('@')) {
        toast.error('Please enter a valid email address')
        return
      }
      
      // Store email in sessionStorage (not localStorage) so it's available for the success page
      // but doesn't persist between browser sessions
      sessionStorage.setItem('purchaseEmail', email)
    }
    
    // Get the current authenticated user to ensure we're using the correct email
    const currentUser = await getAuthenticatedUser()
    
    // If user is logged in, always use their profile email
    // This ensures we're using the email of the currently logged-in user
    const emailToUse = currentUser ? profile?.email : email
    
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
          email: emailToUse, // Use current user's email or entered email
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
  const handleProceed = async () => {
    // Check authentication status again to ensure we have the latest state
    const currentUser = await getAuthenticatedUser()
    
    // Skip email input if user is logged in
    if (currentUser && profile) {
      handleBuyTicket()
    } else {
      // Always show email input when not logged in
      // Clear any existing email to ensure user enters a new one
      setEmail('')
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
