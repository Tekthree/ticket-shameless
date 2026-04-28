import './globals.css'
import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import SSNavbar from '@/components/SSNavbar'
import SSFooter from '@/components/SSFooter'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-barlow',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://simplyshameless.com'),
  title: {
    default: 'Simply Shameless — Seattle Underground House & Techno',
    template: '%s | Simply Shameless',
  },
  description: "Seattle's underground house and techno collective. We throw parties that feel like freedom — live events, DJ nights, and day parties at Monkey Loft and beyond.",
  openGraph: {
    siteName: 'Simply Shameless',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@simplyshameless',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlowCondensed.variable} ${dmSans.variable} min-h-screen flex flex-col`} style={{ fontFamily: 'var(--font-dm), sans-serif', background: '#1c1917', color: '#f0ece6' }}>
        <SSNavbar />
        <main className="flex-grow">{children}</main>
        <SSFooter />
        <Toaster />
      </body>
    </html>
  )
}
