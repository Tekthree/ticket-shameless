'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Event, Artist } from '@/lib/events'
import { useDebounce } from '@/lib/hooks'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
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
  
  const handleSelectChange = (value: string, name: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.calendar className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title*</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Image URL*</Label>
              <Input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date*</Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time*</Label>
              <Input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.fileText className="h-5 w-5" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              HTML formatting is supported for rich text.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Venue Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.mapPin className="h-5 w-5" />
            Venue Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue Name*</Label>
              <Input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address*</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Ticket Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.ticket className="h-5 w-5" />
            Ticket Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)*</Label>
              <Input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticketsTotal">Total Tickets*</Label>
              <Input
                type="number"
                id="ticketsTotal"
                name="ticketsTotal"
                value={formData.ticketsTotal}
                onChange={handleInputChange}
                required
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticketsRemaining">Tickets Remaining*</Label>
              <Input
                type="number"
                id="ticketsRemaining"
                name="ticketsRemaining"
                value={formData.ticketsRemaining}
                onChange={handleInputChange}
                required
                min="0"
                max={formData.ticketsTotal}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.info className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="promoter">Promoter*</Label>
              <Input
                type="text"
                id="promoter"
                name="promoter"
                value={formData.promoter}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ageRestriction">Age Restriction</Label>
              <Select
                value={formData.ageRestriction}
                onValueChange={(value) => handleSelectChange(value, 'ageRestriction')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="21+">21+</SelectItem>
                  <SelectItem value="18+">18+</SelectItem>
                  <SelectItem value="All Ages">All Ages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lineup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.music className="h-5 w-5" />
            Event Lineup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Lineup */}
          {formData.lineup.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Lineup</h3>
              <div className="space-y-2">
                {formData.lineup.map((artist) => (
                  <div key={artist.id} className="flex items-center justify-between bg-muted p-3 rounded">
                    <div className="flex items-center gap-3">
                      {artist.image && (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted-foreground/20">
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
                        {artist.time && <p className="text-sm text-muted-foreground">{artist.time}</p>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeArtistFromLineup(artist.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Icons.trash className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add Artist Section */}
          <div className="border rounded-md p-4">
            {!showNewArtistForm ? (
              <>
                <h3 className="text-lg font-semibold mb-3">Add Artist to Lineup</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="artistSearch">Search Artists</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="artistSearch"
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        placeholder="Start typing to search artists..."
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-3">
                          <Icons.spinner className="animate-spin h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border rounded-md overflow-hidden max-h-40 overflow-y-auto">
                        {searchResults.map(artist => (
                          <div 
                            key={artist.id}
                            className={cn(
                              "p-2 cursor-pointer hover:bg-accent",
                              selectedArtist?.id === artist.id ? 'bg-accent' : ''
                            )}
                            onClick={() => setSelectedArtist(artist)}
                          >
                            <div className="flex items-center gap-2">
                              {artist.image && (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
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
                      <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Icons.warning className="h-4 w-4 text-amber-500" />
                        No artists found.
                        <Button
                          type="button"
                          onClick={() => {
                            setShowNewArtistForm(true)
                            setNewArtist(prev => ({ ...prev, name: artistSearch }))
                          }}
                          variant="link"
                          className="h-auto p-0"
                        >
                          Create new artist
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {selectedArtist && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="performanceTime">Performance Time</Label>
                        <Input
                          type="text"
                          id="performanceTime"
                          value={performanceTime}
                          onChange={(e) => setPerformanceTime(e.target.value)}
                          placeholder="e.g., 9:00 PM - 10:30 PM"
                        />
                      </div>
                      
                      <Button
                        type="button"
                        onClick={addArtistToLineup}
                        variant="shameless"
                      >
                        <Icons.add className="h-4 w-4 mr-2" />
                        Add to Lineup
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">Create New Artist</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="newArtistName">Artist Name</Label>
                    <Input
                      type="text"
                      id="newArtistName"
                      value={newArtist.name}
                      onChange={(e) => setNewArtist(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newArtistImage">Artist Image URL</Label>
                    <Input
                      type="url"
                      id="newArtistImage"
                      value={newArtist.image}
                      onChange={(e) => setNewArtist(prev => ({ ...prev, image: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newArtistPerformanceTime">Performance Time</Label>
                    <Input
                      type="text"
                      id="newArtistPerformanceTime"
                      value={performanceTime}
                      onChange={(e) => setPerformanceTime(e.target.value)}
                      placeholder="e.g., 9:00 PM - 10:30 PM"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={createNewArtist}
                      variant="shameless"
                    >
                      <Icons.add className="h-4 w-4 mr-2" />
                      Create and Add
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowNewArtistForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          onClick={() => router.push('/admin')}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="shameless"
        >
          {isSubmitting ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icons.check className="mr-2 h-4 w-4" />
              {event ? 'Update Event' : 'Create Event'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
