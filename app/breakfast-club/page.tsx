import { redirect } from 'next/navigation'
import { BREAKFAST_CLUB_2027 } from '../events/[slug]/BreakfastClubPromo'

export default function BreakfastClubPage() {
  redirect(`/events/${BREAKFAST_CLUB_2027}`)
}
