import type { Metadata } from 'next'
import GalleryClient from './GalleryClient'
import { ANNIV_URLS, PICFLOW_URLS, TBC2024_URLS, REVERIE_URLS, DECKD_OUT_PRIDE_2026_URLS } from './gallery-data'

export const metadata: Metadata = {
  title: 'Gallery | Simply Shameless',
  description: 'Photos from Simply Shameless events. Seattle underground house and techno.',
  alternates: { canonical: 'https://www.simplyshameless.com/gallery' },
  openGraph: {
    title: 'Gallery | Simply Shameless',
    description: 'Photos from Simply Shameless events. Seattle underground house and techno.',
    url: 'https://www.simplyshameless.com/gallery',
    images: [{
      url: 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_disco_balls_hands_up.jpg',
      alt: 'Crowd dancing at a Simply Shameless event, Monkey Loft Seattle',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery | Simply Shameless',
    description: 'Photos from Simply Shameless events. Seattle underground house and techno.',
    images: ['https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/Club%20Yes%20and%20Shameless%2023%20year%20anniversary%20party%20images/shameless_aniversary_23year_party_monkey_loft_seattle_crowd_dancing_disco_balls_hands_up.jpg'],
  },
}

const ASPECTS = [1, 1.25, 0.8, 1.1, 0.9, 1.2, 1, 0.85, 1.15, 1, 1.3, 0.8, 1, 1.1, 0.9, 1, 1.2, 0.85, 1.1, 1]
const MANNY = { name: 'Manny Dan', url: 'https://www.instagram.com/manny_dan_media/' }

function makePhotos(urls: string[], prefix: string, label: string) {
  return urls.map((src, i) => ({
    id: `${prefix}-${i}`,
    src,
    alt: `${label} — photo ${i + 1}`,
    aspect: ASPECTS[i % ASPECTS.length],
  }))
}

export default function GalleryPage() {
  const events = [
    {
      id: 'deckd-out-pride-2026',
      title: "Deck'd Out #2 Pride Edition",
      tabTitle: "Deck'd Out",
      date: 'June 25, 2026',
      venue: 'Seattle, WA',
      photographer: MANNY,
      photos: makePhotos(DECKD_OUT_PRIDE_2026_URLS, 'deckd-pride-26', "Deck'd Out #2 Pride Edition"),
    },
    {
      id: 'reverie-society-apr-26',
      title: 'Reverie Society',
      date: 'April 12, 2026',
      venue: 'Monkey Loft, Seattle',
      photographer: MANNY,
      photos: makePhotos(REVERIE_URLS, 'reverie', 'Reverie Society'),
    },
    {
      id: 'club-yes-anniversary',
      title: 'Club Yes x Shameless',
      date: '23rd Anniversary',
      venue: 'Monkey Loft, Seattle',
      photographer: MANNY,
      photos: makePhotos(ANNIV_URLS, 'anniv', 'Club Yes & Shameless 23rd Anniversary'),
    },
    {
      id: 'breakfast-club-dec',
      title: 'The Breakfast Club',
      date: '2025',
      venue: 'Monkey Loft, Seattle',
      photographer: MANNY,
      photos: makePhotos(PICFLOW_URLS, 'picflow', 'The Breakfast Club'),
    },
    {
      id: 'breakfast-club-2024',
      title: 'The Breakfast Club',
      date: '2024',
      venue: 'Monkey Loft, Seattle',
      photographer: MANNY,
      photos: makePhotos(TBC2024_URLS, 'tbc24', 'The Breakfast Club 2024'),
    },
  ]

  return <GalleryClient events={events} />
}
