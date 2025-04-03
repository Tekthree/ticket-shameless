import { Metadata } from 'next'
import Link from 'next/link'
import AdminEventsList from '@/components/AdminEventsList'
import { getEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Shameless Productions',
  description: 'Manage events and tickets for Shameless Productions',
}

export default async function AdminDashboardPage() {
  const events = await getEvents()
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/admin/events/new" className="btn-primary">
          Create New Event
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Events Management</h2>
          <AdminEventsList events={events} />
        </div>
      </div>
    </div>
  )
}
