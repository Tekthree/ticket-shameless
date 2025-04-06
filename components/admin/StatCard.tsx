'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  className?: string
}

export function StatCard({ title, value, className }: StatCardProps) {
  return (
    <Card className={cn("border bg-background/50", className)}>
      <CardContent className="pt-6">
        <div className="text-muted-foreground text-sm">{title}</div>
        <div className="text-3xl font-bold mt-2">{value}</div>
      </CardContent>
    </Card>
  )
}
