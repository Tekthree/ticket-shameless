'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ActionCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  bgColor?: string
  iconBgColor?: string
}

export function ActionCard({
  href,
  icon,
  title,
  description,
  bgColor = "bg-slate-100 dark:bg-slate-800",
  iconBgColor = "bg-primary"
}: ActionCardProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "block rounded-lg p-4 transition-all hover:shadow-md",
        bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "rounded-full p-2 flex items-center justify-center",
          iconBgColor
        )}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  )
}
