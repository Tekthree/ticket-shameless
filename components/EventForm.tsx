'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Event } from '@/lib/events'
import toast from 'react-hot-toast'

interface EventFormProps {
  event?: Event
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    address: '',
    image: '',
    price: 0,
    ticketsTotal: 0,
    ticketsRemaining: 0,
    promoter: '',
    ageRestriction: '21+',
  })
  
  // If editing an existing event, populate form with event data
  useEffect(() => {
    if (event) {
      console.log('Initializing form with event data:', event)
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date.split('T')[0], // Format date for input
        time: event.time,
        venue: event.venue,
        address: event.address,
        image: event.image,
        price: event.price,
        ticketsTotal: event.ticketsTotal,
        ticketsRemaining: event.ticketsRemaining,
        promoter: event.promoter,
        ageRestriction: event.ageRestriction || '21+',
      })
    }
  }, [event])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Handle number inputs
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Format the data for API
      const eventData = {
        ...formData,
        // Ensure price is a number
        price: parseFloat(formData.price.toString()),
        // Ensure tickets counts are numbers
        ticketsTotal: parseInt(formData.ticketsTotal.toString()),
        ticketsRemaining: parseInt(formData.ticketsRemaining.toString()),
        // Add lineup if it exists in the original event
        lineup: event?.lineup || [],
        // Add soldOut status based on remaining tickets
        soldOut: parseInt(formData.ticketsRemaining.toString()) <= 0
      }
      
      console.log('Submitting event data:', eventData)
      
      // Update or create the event
      const url = event ? `/api/events/${event.id}` : '/api/events'
      const method = event ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save event')
      }
      
      toast.success(event ? 'Event updated successfully' : 'Event created successfully')
      
      // Redirect to the event list
      router.push('/admin')
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
      console.error('Error saving event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL*
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date*
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time*
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description*
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={6}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">
            HTML formatting is supported for rich text.
          </p>
        </div>
        
        {/* Venue Information */}
        <div>
          <h2 className="text-xl font-bold mb-4">Venue Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name*
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address*
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>
        
        {/* Ticket Information */}
        <div>
          <h2 className="text-xl font-bold mb-4">Ticket Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="ticketsTotal" className="block text-sm font-medium text-gray-700 mb-1">
                Total Tickets*
              </label>
              <input
                type="number"
                id="ticketsTotal"
                name="ticketsTotal"
                value={formData.ticketsTotal}
                onChange={handleChange}
                required
                min="0"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="ticketsRemaining" className="block text-sm font-medium text-gray-700 mb-1">
                Tickets Remaining*
              </label>
              <input
                type="number"
                id="ticketsRemaining"
                name="ticketsRemaining"
                value={formData.ticketsRemaining}
                onChange={handleChange}
                required
                min="0"
                max={formData.ticketsTotal}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Information */}
        <div>
          <h2 className="text-xl font-bold mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="promoter" className="block text-sm font-medium text-gray-700 mb-1">
                Promoter*
              </label>
              <input
                type="text"
                id="promoter"
                name="promoter"
                value={formData.promoter}
                onChange={handleChange}
                required
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label htmlFor="ageRestriction" className="block text-sm font-medium text-gray-700 mb-1">
                Age Restriction
              </label>
              <select
                id="ageRestriction"
                name="ageRestriction"
                value={formData.ageRestriction}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              >
                <option value="21+">21+</option>
                <option value="18+">18+</option>
                <option value="All Ages">All Ages</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </form>
  )
}
