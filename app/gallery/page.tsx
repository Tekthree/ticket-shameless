import type { Metadata } from 'next'
import GalleryClient from './GalleryClient'

export const metadata: Metadata = {
  title: 'Gallery | Simply Shameless',
  description: 'Photos from Simply Shameless events. Seattle underground house and techno.',
  alternates: { canonical: 'https://simplyshameless.com/gallery' },
  openGraph: {
    title: 'Gallery | Simply Shameless',
    description: 'Photos from Simply Shameless events. Seattle underground house and techno.',
    url: 'https://simplyshameless.com/gallery',
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

export default function GalleryPage() {
  return <GalleryClient />
}
