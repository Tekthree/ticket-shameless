import { Metadata } from 'next'
import Link from 'next/link'
import AdminEventsList from '@/components/AdminEventsList'
import { getEvents } from '@/lib/events'
import AdminHeader from '@/components/AdminHeader'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Shameless Productions',
  description: 'Manage events and tickets for Shameless Productions',
}

export default async function AdminDashboardPage() {
  const events = await getEvents()
  
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Link href="/admin/events/new" className="btn-primary">
            Create New Event
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                href="/admin/events/new" 
                className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg flex items-center"
              >
                <div className="bg-indigo-500 text-white p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium">New Event</span>
                  <span className="text-sm text-gray-500">Create a new event</span>
                </div>
              </Link>
              
              <Link 
                href="/admin/artists" 
                className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center"
              >
                <div className="bg-purple-500 text-white p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium">Manage Artists</span>
                  <span className="text-sm text-gray-500">Add or edit artists</span>
                </div>
              </Link>
              
              <Link 
                href="/admin/site-content" 
                className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex items-center"
              >
                <div className="bg-green-500 text-white p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium">Site Content</span>
                  <span className="text-sm text-gray-500">Edit landing page content</span>
                </div>
              </Link>
              
              <Link 
                href="/" 
                target="_blank"
                className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center"
              >
                <div className="bg-blue-500 text-white p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <span className="block font-medium">View Site</span>
                  <span className="text-sm text-gray-500">Preview public website</span>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Site Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500 block">Total Events</span>
                <span className="text-2xl font-bold">{events.length}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500 block">Upcoming Events</span>
                <span className="text-2xl font-bold">
                  {events.filter(event => new Date(event.date) > new Date()).length}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500 block">Active Tickets</span>
                <span className="text-2xl font-bold">-</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500 block">Total Sales</span>
                <span className="text-2xl font-bold">-</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Events Management</h2>
            <AdminEventsList events={events} />
          </div>
        </div>
      </div>
    </div>
  )
}
