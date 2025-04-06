import { Metadata } from 'next'
import SimpleAuth from '@/components/SimpleAuth'

export const metadata: Metadata = {
  title: 'Login - Shameless Productions',
  description: 'Sign in to manage Shameless events',
}

export default function SimpleLoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <SimpleAuth />
      </div>
    </div>
  )
}
