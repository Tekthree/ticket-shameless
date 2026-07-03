import { getDJBySlug, getDJEvents, getDJs } from '@/lib/db'
import type { DJ, Event } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DJProfileClient from './DJProfileClient'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const djs = await getDJs()
    return djs.map(dj => ({ slug: dj.slug }))
  } catch {
    return []
  }
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dj = await getDJBySlug(slug).catch(() => null)
  if (!dj) return { title: 'DJ Not Found' }

  const description = dj.seo_description ?? dj.bio?.slice(0, 155) ?? `${dj.name} plays Simply Shameless events in Seattle.`

  const url = `https://www.simplyshameless.com/djs/${slug}`

  return {
    title: dj.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${dj.name} | Simply Shameless`,
      description,
      url,
      images: dj.profile_image_url ? [{ url: dj.profile_image_url, width: 800, height: 800, alt: dj.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dj.name} | Simply Shameless`,
      description,
      images: dj.profile_image_url ? [dj.profile_image_url] : [],
    },
  }
}

export default async function DJProfilePage({ params }: Props) {
  const { slug } = await params
  const dj = await getDJBySlug(slug).catch(() => null)
  if (!dj) notFound()

  let events: Event[] = []
  try {
    events = await getDJEvents(dj.id)
  } catch {
    // no events or DB issue
  }

  const sameAs = [
    dj.instagram_url,
    dj.soundcloud_url,
    dj.spotify_url,
    dj.youtube_url,
    dj.mixcloud_url,
    dj.website_url,
  ].filter(Boolean) as string[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: dj.name,
    url: `https://www.simplyshameless.com/djs/${slug}`,
    description: dj.bio ?? undefined,
    ...(dj.profile_image_url ? { image: dj.profile_image_url } : {}),
    ...(dj.location ? { location: { '@type': 'Place', name: dj.location } } : {}),
    ...(dj.genres.length > 0 ? { genre: dj.genres } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    member: { '@type': 'Organization', name: 'Simply Shameless', url: 'https://www.simplyshameless.com' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DJProfileClient dj={dj} events={events} />
    </>
  )
}
