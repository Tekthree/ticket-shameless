import { format, parseISO } from 'date-fns'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'EEEE, MMMM d, yyyy')
}

export function formatTime(timeString: string): string {
  // Expected format: "19:00:00"
  if (!timeString) return ''
  
  // Parse hours and minutes
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
  
  // Format as 12-hour time with AM/PM
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  
  return `${hour12}:${minutes} ${period}`
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}