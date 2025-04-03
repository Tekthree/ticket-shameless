import Link from 'next/link'

export default function EventNotFound() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-6">Event Not Found</h1>
      <p className="text-lg mb-8">
        Sorry, the event you're looking for doesn't exist or may have been removed.
      </p>
      <Link href="/events" className="btn-primary">
        Browse All Events
      </Link>
    </div>
  )
}
