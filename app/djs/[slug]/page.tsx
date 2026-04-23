import { getDJBySlug, getDJEvents } from '@/lib/db'
import type { DJ, Event } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DJProfileClient from './DJProfileClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dj = await getDJBySlug(slug).catch(() => null)
  if (!dj) return { title: 'DJ Not Found | Simply Shameless' }

  const description = dj.seo_description ?? dj.bio?.slice(0, 155) ?? `${dj.name} plays Simply Shameless events in Seattle.`

  return {
    title: `${dj.name} | Simply Shameless`,
    description,
    openGraph: {
      title: `${dj.name} | Simply Shameless`,
      description,
      images: dj.profile_image_url ? [{ url: dj.profile_image_url }] : [],
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

  return <DJProfileClient dj={dj} events={events} />
}
