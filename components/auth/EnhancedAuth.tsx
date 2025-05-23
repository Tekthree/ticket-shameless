'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export default function EnhancedAuth() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
      
      // Verify the user is authenticated using the secure method
      const user = await getAuthenticatedUser()
      
      if (!user) {
        throw new Error('Authentication failed')
      }
      
      toast.success('Signed in successfully')
      router.push('/admin')
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Enhanced Sign In</h1>
        <p className="text-gray-600 mt-2">
          Sign in to manage your Shameless events
        </p>
      </div>
      
      <form onSubmit={handleSignIn} className="space-y-6">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            placeholder="••••••••"
          />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}
