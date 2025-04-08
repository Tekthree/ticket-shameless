'use client'

import { useEffect, useRef, useState } from 'react'

interface GoogleMapProps {
  address: string
  venueTitle?: string
}

declare global {
  interface Window {
    initMap: () => void
    google: any
  }
}

// Define Google Maps API types
interface GeocoderResult {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    }
  };
  [key: string]: any;
}

type GeocoderStatus = 
  | 'OK'
  | 'ZERO_RESULTS'
  | 'OVER_DAILY_LIMIT'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

export default function GoogleMap({ address, venueTitle }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Skip if map is already loaded or there's no address
    if (isLoaded || !address) return
    
    // Define the callback function for when the API loads
    window.initMap = () => {
      if (!mapRef.current) return
      
      const geocoder = new window.google.maps.Geocoder()
      
      geocoder.geocode({ address }, (results: GeocoderResult[] | null, status: GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: results[0].geometry.location,
            zoom: 15,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#ffffff" }]
              },
              {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{ "visibility": "on" }, { "color": "#3e3e3e" }, { "weight": 2 }, { "gamma": "1" }]
              },
              {
                "featureType": "all",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }]
              },
              {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [{ "weight": 0.6 }, { "color": "#1f1f1f" }]
              },
              {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{ "color": "#2e2e2e" }]
              },
              {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{ "color": "#3c3c3c" }]
              },
              {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{ "color": "#4c4c4c" }]
              },
              {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{ "color": "#505050" }]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#1f1f1f" }]
              }
            ]
          })
          
          // Add a marker for the venue
          const marker = new window.google.maps.Marker({
            map,
            position: results[0].geometry.location,
            title: venueTitle || address,
            animation: window.google.maps.Animation.DROP
          })
          
          // Add info window if we have a venue title
          if (venueTitle) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="color: #000; padding: 5px;"><b>${venueTitle}</b><br>${address}</div>`
            })
            
            marker.addListener('click', () => {
              infoWindow.open(map, marker)
            })
          }
          
          setIsLoaded(true)
        } else {
          setError(`Could not geocode address: ${status} - This usually indicates an API key issue. Please check your Google Maps API key.`)
          console.error(`Google Maps API error: ${status}. Make sure your API key is valid and has the Geocoding API enabled.`)
        }
      })
    }
    
    // Load the Google Maps API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log('API Key available:', !!apiKey) // Log if API key exists (without revealing it)
    
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
    script.async = true
    script.defer = true
    script.onerror = () => {
      setError('Failed to load Google Maps API')
    }
    
    document.head.appendChild(script)
    
    return () => {
      // Clean up
      document.head.removeChild(script)
      window.initMap = () => {}
    }
  }, [address, venueTitle])
  
  return (
    <div className="w-full h-64 bg-gray-800 rounded-lg overflow-hidden relative">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-gray-500 mb-3">{error}</p>
          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-4 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
          >
            View on Google Maps
          </a>
        </div>
      ) : (
        <>
          <div ref={mapRef} className="w-full h-full" />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  )
}
