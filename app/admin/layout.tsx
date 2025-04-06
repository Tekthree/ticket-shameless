'use client'

import AdminHeader from '@/components/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
}
