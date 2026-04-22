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
  title: 'Simply Shameless — Seattle Underground',
  description: "Seattle's underground house & techno collective. We throw parties that feel like freedom.",
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
