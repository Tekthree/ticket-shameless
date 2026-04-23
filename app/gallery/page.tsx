import type { Metadata } from 'next'
import GalleryClient from './GalleryClient'

export const metadata: Metadata = {
  title: 'Gallery | Simply Shameless',
  description: 'Photos from Simply Shameless events. Seattle underground house and techno.',
}

export default function GalleryPage() {
  return <GalleryClient />
}
