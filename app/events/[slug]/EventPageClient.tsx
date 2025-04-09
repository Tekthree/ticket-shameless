"use client"

import Image from 'next/image'
import { notFound, useSearchParams } from 'next/navigation'
import BuyTicketButton from '@/components/BuyTicketButton'
import GoogleMap from '@/components/GoogleMap'
import { formatDate } from '@/lib/utils'
import AudioPlayer from '@/components/AudioPlayer'
import { useEffect, useRef, useState } from 'react'
import SocialShareButtons from '@/components/SocialShareButtons'
import ArtistTrackCard from '@/components/ArtistTrackCard'
import PurchaseSuccess from '@/components/PurchaseSuccess'

interface Artist {
  id?: string;
  name: string;
  image?: string;
  time?: string;
  mix_url?: string;
  description?: string;
}

interface EventPageClientProps {
  event: {
    id: string;
    title: string;
    slug: string;
    image: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    price: number;
    ticketsRemaining: number;
    ticketsTotal?: number;
    soldOut: boolean;
    ageRestriction?: string;
    description?: string;
    promoter?: string;
    lineup?: Artist[];
  }
}

const EventPageClient = ({ event }: EventPageClientProps) => {
  // Check if we have event data
  if (!event) {
    notFound()
  }
  
  // Get search params to check for success parameter
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  // Use a default image if the event image is an external URL that might cause issues
  const imageUrl = event.image.startsWith('http') ? event.image : '/images/logo.png';
  const eventUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // Ref for scroll tracking
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Track scroll position to adjust blur and scale
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollPosition = window.scrollY;
        const maxScroll = 500; // Adjust this value to control when max effect is reached
        const progress = Math.min(scrollPosition / maxScroll, 1);
        setScrollProgress(progress);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Check for success parameter and show success message
  useEffect(() => {
    if (success === 'true') {
      setShowSuccess(true);
      // Scroll to top to show the success message
      window.scrollTo(0, 0);
    }
  }, [success]);
  
  return (
    <div className="bg-transparent text-white min-h-screen pb-20" ref={contentRef}>
      {/* Sticky Background Image with Blur and Scale Effect */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-black/50"></div> {/* Dark overlay to reduce image prominence */}
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          className="object-cover object-center transition-all duration-200"
          priority
          style={{
            filter: `blur(40px) contrast(120%) brightness(60%)`, // Much stronger fixed blur
            transform: `scale(1.05)`, // Slight scale to ensure coverage
            opacity: 0.8
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/30" />
      </div>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="pt-12">
          <PurchaseSuccess eventSlug={event.slug} eventTitle={event.title} />
        </div>
      )}
      
      {/* Hero Section with event image card */}
      <div className="relative pt-12 pb-12 bg-transparent">
        <div className="max-w-5xl mx-auto px-4">
          {/* Event Image Card */}
          <div className="rounded-lg overflow-hidden shadow-xl border border-gray-800 mb-8 max-w-2xl mx-auto">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="md:col-span-2">
            {/* Event Title & Info */}
            <div className="mb-8 event-title">
              <h1 className="text-6xl md:text-7xl mb-4 font-qikober">{event.title}</h1>
              <div className="mb-4">
                <p className="text-xl">{event.venue}</p>
                <p className="text-red-600 font-medium">
                  {formatDate(event.date)}, {event.time}
                </p>
                {event.ageRestriction && (
                  <div className="inline-flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="currentColor"/>
                    </svg>
                    <span className="text-sm">{event.ageRestriction} event</span>
                  </div>
                )}
                
                {/* Buy Tickets Button - Only visible on mobile */}
                {!event.soldOut && (
                  <div className="mt-4 block md:hidden">
                    <a href="#buy-tickets" className="inline-block py-2 px-6 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition text-center">
                      Buy Tickets
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-800 my-6"></div>
            
            {/* Event Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About This Event</h2>
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-800 my-6"></div>
            
            {/* Event Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Event Information</h2>
              <div className="space-y-2 text-gray-300">
                {event.ticketsTotal > 0 && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.41 11.58L12.41 2.58C12.05 2.22 11.55 2 11 2H4C2.9 2 2 2.9 2 4V11C2 11.55 2.22 12.05 2.59 12.42L11.59 21.42C11.95 21.78 12.45 22 13 22C13.55 22 14.05 21.78 14.41 21.41L21.41 14.41C21.78 14.05 22 13.55 22 13C22 12.45 21.77 11.94 21.41 11.58ZM5.5 7C4.67 7 4 6.33 4 5.5C4 4.67 4.67 4 5.5 4C6.33 4 7 4.67 7 5.5C7 6.33 6.33 7 5.5 7Z" fill="currentColor"/>
                    </svg>
                    <span>Tickets: ${event.price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                  </svg>
                  <span>Doors open: {event.time}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.36 14C16.44 13.34 16.5 12.68 16.5 12C16.5 11.32 16.44 10.66 16.36 10H19.74C19.9 10.64 20 11.31 20 12C20 12.69 19.9 13.36 19.74 14H16.36ZM14.59 19.56C15.19 18.45 15.65 17.25 15.97 16H18.92C17.96 17.65 16.43 18.93 14.59 19.56ZM14.34 14H9.66C9.56 13.34 9.5 12.68 9.5 12C9.5 11.32 9.56 10.65 9.66 10H14.34C14.43 10.65 14.5 11.32 14.5 12C14.5 12.68 14.43 13.34 14.34 14ZM12 19.96C11.17 18.76 10.5 17.43 10.09 16H13.91C13.5 17.43 12.83 18.76 12 19.96ZM8 8H5.08C6.03 6.34 7.57 5.06 9.4 4.44C8.8 5.55 8.35 6.75 8 8ZM5.08 16H8C8.35 17.25 8.8 18.45 9.4 19.56C7.57 18.93 6.03 17.65 5.08 16ZM4.26 14C4.1 13.36 4 12.69 4 12C4 11.31 4.1 10.64 4.26 10H7.64C7.56 10.66 7.5 11.32 7.5 12C7.5 12.68 7.56 13.34 7.64 14H4.26ZM12 4.03C12.83 5.23 13.5 6.57 13.91 8H10.09C10.5 6.57 11.17 5.23 12 4.03ZM18.92 8H15.97C15.65 6.75 15.19 5.55 14.59 4.44C16.43 5.07 17.96 6.34 18.92 8ZM12 2C6.47 2 2 6.5 2 12C2 17.5 6.47 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2Z" fill="currentColor"/>
                  </svg>
                  <span>Presented by {event.promoter}</span>
                </div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-800 my-6"></div>
            
            {/* Lineup Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Lineup</h2>
              <div className="space-y-3">
                {event.lineup.map((artist) => (
                  <div key={artist.id} className="relative border-b border-gray-800 py-4 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-full overflow-hidden flex-shrink-0">
                        {artist.image ? (
                          <Image
                            src={artist.image}
                            alt={artist.name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg">{artist.name.substring(0, 1)}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{artist.name}</p>
                        {artist.time && <p className="text-gray-400">{artist.time}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-800 my-6"></div>
            
            {/* Venue Section - Moved from sidebar to main content area */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Venue</h2>
              <div className="mb-4">
                <p className="font-bold text-white">{event.venue}</p>
                <p className="text-gray-400">{event.address}</p>
              </div>
              
              <GoogleMap address={event.address} venueTitle={event.venue} />
              
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-5 text-white hover:text-gray-300 py-2 px-4 border border-white rounded-full"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                Directions
              </a>
            </div>
            
            {/* Artist Tracks Section */}
            {event.lineup && event.lineup.length > 0 && event.lineup.some(artist => artist.mix_url) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Listen to the Artists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.lineup.filter(artist => artist.mix_url).map((artist, index) => (
                    <ArtistTrackCard 
                      key={`track-${index}`} 
                      artist={{
                        name: artist.name,
                        image: artist.image,
                        mix_url: artist.mix_url || ''
                      }} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Ticket Box Only */}
          <div className="md:col-span-1">
            {/* Ticket Box */}
            <div id="buy-tickets" className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-6 sticky top-4 z-20 border border-gray-800">
              <div className="mb-6">
                <div className="text-3xl font-bold mb-2">${event.price.toFixed(2)}</div>
                <div className="text-gray-400 mb-4">
                  {event.ticketsRemaining > 0 
                    ? `${event.ticketsRemaining} tickets remaining` 
                    : 'Sold out'}
                </div>
              </div>
              
              {event.soldOut ? (
                <button className="w-full py-3 bg-gray-700 text-white font-bold rounded-full cursor-not-allowed mb-4" disabled>
                  Sold Out
                </button>
              ) : (
                <div className="mb-4">
                  <BuyTicketButton 
                    eventId={event.id} 
                    price={event.price}
                    title={event.title}
                  />
                </div>
              )}
              
              <div className="text-sm text-gray-400 space-y-2">
                <p>• No refunds</p>
                <p>• ID required matching the ticket buyer's name</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventPageClient