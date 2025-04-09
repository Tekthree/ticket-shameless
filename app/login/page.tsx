import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Login - Shameless Productions',
  description: 'Sign in to manage Shameless events',
}

export default function LoginPage() {
  // Redirect to the new login page
  redirect('/auth/login')
  
  // This won't be rendered due to the redirect
  return null
}
