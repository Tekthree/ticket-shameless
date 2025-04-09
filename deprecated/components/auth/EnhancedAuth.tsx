'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function EnhancedAuth() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  
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
      
      // After successful login, fetch user roles to determine redirect
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', data.user.id);
        
      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError);
        // Even if we can't fetch roles, we'll proceed with a default redirect
      }
      
      // Determine where to redirect based on user's role
      let redirectPath = '/profile'; // Default redirect
      
      if (userRolesData && userRolesData.length > 0) {
        const roleNames = userRolesData.map(item => item.roles.name);
        
        if (roleNames.includes('admin')) {
          redirectPath = '/admin';
        } else if (roleNames.includes('event_manager')) {
          redirectPath = '/admin/events';
        } else if (roleNames.includes('box_office')) {
          redirectPath = '/box-office';
        } else if (roleNames.includes('artist')) {
          redirectPath = '/artist/dashboard';
        }
      }
      
      toast.success('Signed in successfully')
      router.push(redirectPath)
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        throw error
      }
      
      // On signup, the customer role is automatically assigned by the database trigger
      toast.success('Check your email for the confirmation link')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          {view === 'sign-in' ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="text-gray-600 mt-2">
          {view === 'sign-in'
            ? 'Sign in to manage your Shameless events'
            : 'Create an account to manage Shameless events'}
        </p>
      </div>
      
      <form onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading
            ? 'Loading...'
            : view === 'sign-in'
            ? 'Sign In'
            : 'Create Account'}
        </button>
        
        <div className="text-center">
          {view === 'sign-in' ? (
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setView('sign-up')}
                className="text-red-600 hover:text-red-700 transition"
              >
                Create one
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('sign-in')}
                className="text-red-600 hover:text-red-700 transition"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
