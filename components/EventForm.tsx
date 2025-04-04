'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Event, Artist } from '@/lib/events'
import { useDebounce } from '@/lib/hooks'
import toast from 'react-hot-toast'

interface EventFormProps {
  event?: Event
}

type LineupArtist = {
  id: string
  name: string
  image?: string
  time?: string
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
    lineup: [] as LineupArtist[]
  })
  
  // Artist search state
  const [artistSearch, setArtistSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Artist[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [performanceTime, setPerformanceTime] = useState('')
  const [showNewArtistForm, setShowNewArtistForm] = useState(false)
  const [newArtist, setNewArtist] = useState({ name: '', image: '' })
  
  // Use debounce to avoid too many API calls
  const debouncedSearch = useDebounce(artistSearch, 300)
  
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
        lineup: event.lineup || []
      })
    }
  }, [event])
  
  // Search for artists when the debounced search term changes
  useEffect(() => {
    const searchArtists = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([])
        return
      }
      
      setIsSearching(true)
      try {
        const response = await fetch(`/api/artists/search?term=${encodeURIComponent(debouncedSearch)}`)
        if (!response.ok) throw new Error('Failed to search artists')
        const data = await response.json()
        setSearchResults(data)
      } catch (error) {
        console.error('Error searching artists:', error)
        toast.error('Failed to search artists')
      } finally {
        setIsSearching(false)
      }
    }
    
    searchArtists()
  }, [debouncedSearch])
  
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
  
  // Function to add an artist to the lineup
  const addArtistToLineup = () => {
    if (!selectedArtist) return
    
    setFormData(prev => ({
      ...prev,
      lineup: [...prev.lineup, {
        ...selectedArtist,
        time: performanceTime
      }]
    }))
    
    // Reset the form
    setSelectedArtist(null)
    setPerformanceTime('')
    setArtistSearch('')
  }
  
  // Function to create a new artist
  const createNewArtist = async () => {
    if (!newArtist.name.trim()) {
      toast.error('Artist name is required')
      return
    }
    
    try {
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArtist)
      })
      
      if (!response.ok) throw new Error('Failed to create artist')
      
      const createdArtist = await response.json()
      
      // Add the new artist to the lineup
      setFormData(prev => ({
        ...prev,
        lineup: [...prev.lineup, {
          ...createdArtist,
          time: performanceTime
        }]
      }))
      
      toast.success('Artist created and added to lineup')
      
      // Reset the forms
      setNewArtist({ name: '', image: '' })
      setShowNewArtistForm(false)
      setPerformanceTime('')
    } catch (error) {
      console.error('Error creating artist:', error)
      toast.error('Failed to create artist')
    }
  }
  
  // Function to remove an artist from the lineup
  const removeArtistFromLineup = (artistId: string) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.filter(artist => artist.id !== artistId)
    }))
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
        
        {/* Lineup Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Event Lineup</h2>
          
          {/* Current Lineup */}
          {formData.lineup.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Current Lineup</h3>
              <div className="space-y-2">
                {formData.lineup.map((artist) => (
                  <div key={artist.id} className="flex items-center justify-between bg-gray-100 p-3 rounded">
                    <div className="flex items-center gap-3">
                      {artist.image && (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{artist.name}</p>
                        {artist.time && <p className="text-sm text-gray-500">{artist.time}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeArtistFromLineup(artist.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add Artist Section */}
          <div className="border p-4 rounded-md mb-4">
            {!showNewArtistForm ? (
              <>
                <h3 className="text-lg font-semibold mb-3">Add Artist to Lineup</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="artistSearch" className="block text-sm font-medium text-gray-700 mb-1">
                      Search Artists
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="artistSearch"
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        placeholder="Start typing to search artists..."
                        className="block w-full p-2 border border-gray-300 rounded-md"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2">
                          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-md overflow-hidden max-h-40 overflow-y-auto">
                        {searchResults.map(artist => (
                          <div 
                            key={artist.id}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedArtist?.id === artist.id ? 'bg-gray-100' : ''}`}
                            onClick={() => setSelectedArtist(artist)}
                          >
                            <div className="flex items-center gap-2">
                              {artist.image && (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                                  <Image
                                    src={artist.image}
                                    alt={artist.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <span>{artist.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchResults.length === 0 && artistSearch.trim() !== '' && !isSearching && (
                      <div className="mt-2 text-sm text-gray-500">
                        No artists found.
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewArtistForm(true)
                            setNewArtist(prev => ({ ...prev, name: artistSearch }))
                          }}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          Create new artist
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {selectedArtist && (
                    <>
                      <div>
                        <label htmlFor="performanceTime" className="block text-sm font-medium text-gray-700 mb-1">
                          Performance Time
                        </label>
                        <input
                          type="text"
                          id="performanceTime"
                          value={performanceTime}
                          onChange={(e) => setPerformanceTime(e.target.value)}
                          placeholder="e.g., 9:00 PM - 10:30 PM"
                          className="block w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={addArtistToLineup}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Add to Lineup
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">Create New Artist</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="newArtistName" className="block text-sm font-medium text-gray-700 mb-1">
                      Artist Name
                    </label>
                    <input
                      type="text"
                      id="newArtistName"
                      value={newArtist.name}
                      onChange={(e) => setNewArtist(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newArtistImage" className="block text-sm font-medium text-gray-700 mb-1">
                      Artist Image URL
                    </label>
                    <input
                      type="url"
                      id="newArtistImage"
                      value={newArtist.image}
                      onChange={(e) => setNewArtist(prev => ({ ...prev, image: e.target.value }))}
                      className="block w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newArtistPerformanceTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Performance Time
                    </label>
                    <input
                      type="text"
                      id="newArtistPerformanceTime"
                      value={performanceTime}
                      onChange={(e) => setPerformanceTime(e.target.value)}
                      placeholder="e.g., 9:00 PM - 10:30 PM"
                      className="block w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={createNewArtist}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Create and Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewArtistForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
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
