import { Metadata } from 'next'
import EnhancedAuth from '@/components/auth/EnhancedAuth'

export const metadata: Metadata = {
  title: 'Login - Shameless Productions',
  description: 'Sign in to Shameless Productions',
}

export default function EnhancedLoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <EnhancedAuth />
      </div>
    </div>
  )
}
