import Image from 'next/image'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import { getEvents } from '@/lib/events'

export default async function Home() {
  const events = await getEvents(3) // Get the 3 newest events
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0 bg-black">
          <Image
            src="/images/logo.png"
            alt="Shameless Productions"
            fill
            className="object-cover opacity-70"
            priority
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            22 Years Shameless
          </h1>
          <p className="text-xl md:text-2xl mb-12">
            Keeping It Weird Since 2003
          </p>
          <Link 
            href="/events" 
            className="btn-primary text-lg px-8 py-3"
          >
            Upcoming Events
          </Link>
        </div>
      </section>
      
      {/* About Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <Image 
                  src="/images/logo.png" 
                  alt="Club scene" 
                  width={500} 
                  height={400}
                  className="rounded-lg"
                />
              </div>
              <div className="md:w-1/2">
                <h2 className="text-4xl font-bold mb-6">Keeping It Weird Since 2003</h2>
                <p className="text-lg mb-4">
                  In 2003, Shameless first took shape as a weekly indie dance night in the basement 
                  of the Alibi Room located in Seattle's historic Pike Place Market. The ensemble 
                  quickly became one of the city's most respected underground dance music 
                  collectives by throwing numerous legendary club nights, open air and after parties.
                </p>
                <p className="text-lg">
                  DANCEFLOOR PICTURES
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Events Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Upcoming Events</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link 
              href="/events" 
              className="btn-secondary"
            >
              View All Events
            </Link>
          </div>
        </div>
      </section>
      
      {/* Motto Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-6">Shake Your Shame Off And Get Your Game On.</h2>
              <p className="text-lg mb-4">
                From day one, each Shameless party was a special one regardless of the wide ranges of 
                genres and bookings represented. With an eye towards the cutting edge, but deep respect 
                for electronic music's rich history, Shameless has kept its finger on the pulse of 
                Seattle's underground for years now and yet keeps looking forward.
              </p>
            </div>
            <div className="md:w-1/2">
              <Image 
                src="/images/logo.png" 
                alt="Shameless crowd" 
                width={500} 
                height={400}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
