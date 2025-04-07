import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/theme-provider'
import { AudioProvider } from '@/components/AudioPlayer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shameless Productions - Electronic Music Events',
  description: 'Keeping It Weird Since 2003 - Seattle\'s premier electronic music events and collectives',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen flex flex-col ${inter.className}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AudioProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
