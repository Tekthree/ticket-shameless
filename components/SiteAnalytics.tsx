'use client'

import { useEffect, useRef, useState } from 'react'
import type { PostHog } from 'posthog-js'
import { currentNewsletterAttribution } from '@/lib/newsletter-attribution'

type Choice = 'allow' | 'decline'
const preferenceKey = 'shameless-analytics-preference'
const preferenceEvent = 'shameless-analytics-change'
function savedPreference() {
  try {
    return window.localStorage.getItem(preferenceKey)
  } catch {
    return null
  }
}

function useAnalyticsPreference() {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined)
  useEffect(() => {
    const sync = () => {
      const saved = savedPreference()
      setChoice(saved === 'allow' || saved === 'decline' ? saved : null)
    }
    sync()
    window.addEventListener(preferenceEvent, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(preferenceEvent, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return [choice, (next: Choice) => {
    try {
      window.localStorage.setItem(preferenceKey, next)
      window.dispatchEvent(new Event(preferenceEvent))
    } catch {
      setChoice(null)
    }
  }] as const
}

export function AnalyticsPreferences() {
  const [choice, setChoice] = useAnalyticsPreference()
  return <div>
    <p className="mb-3">Analytics preference: {choice === 'allow' ? 'Allowed' : choice === 'decline' ? 'Declined' : 'Undecided'}</p>
    <div className="flex flex-wrap gap-3">
      <button className="rounded border px-3 py-2" type="button" onClick={() => setChoice('allow')}>Allow analytics</button>
      <button className="rounded border px-3 py-2" type="button" onClick={() => setChoice('decline')}>Decline analytics</button>
    </div>
  </div>
}

export default function SiteAnalytics({ projectToken, apiHost }: { projectToken: string; apiHost: string }) {
  const [choice, setChoice] = useAnalyticsPreference()
  const client = useRef<PostHog | null>(null)

  useEffect(() => { currentNewsletterAttribution() }, [])

  useEffect(() => {
    if (choice !== 'allow') {
      client.current?.opt_out_capturing()
      return
    }

    let active = true
    const captureClick = (event: MouseEvent) => {
      if (savedPreference() !== 'allow' || !(event.target instanceof Element)) return
      const element = event.target.closest<HTMLElement>('[data-analytics-event]')
      const name = element?.dataset.analyticsEvent
      if (!name) return
      client.current?.capture(name, {
        festival: 'breakfast_club_2027',
        interaction_target: element.dataset.analyticsTarget,
      }, { transport: 'sendBeacon' })
    }

    const captureSignup = (event: Event) => {
      const source = (event as CustomEvent<unknown>).detail
      if (savedPreference() !== 'allow' || (source !== 'homepage' && source !== 'breakfast-club-2027')) return
      client.current?.capture('newsletter_signup', { signup_placement: source })
    }

    void import('posthog-js').then(({ default: posthog }) => {
      if (!active || savedPreference() !== 'allow') return
      if (client.current) {
        if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing({ captureEventName: false })
      } else {
        posthog.init(projectToken, {
          api_host: apiHost,
          autocapture: false,
          capture_pageview: 'history_change',
          capture_pageleave: false,
          capture_dead_clicks: false,
          capture_heatmaps: false,
          capture_exceptions: false,
          capture_performance: false,
          disable_session_recording: true,
          disable_surveys: true,
          advanced_disable_flags: true,
          person_profiles: 'never',
          persistence: 'localStorage',
          before_send: event => savedPreference() === 'allow' ? event : null,
        })
        client.current = posthog
      }
      document.addEventListener('click', captureClick, true)
      window.addEventListener('shameless-newsletter-signup', captureSignup)
    }).catch(() => {
      // Analytics is optional. A blocked SDK should never interrupt navigation.
    })

    return () => {
      active = false
      document.removeEventListener('click', captureClick, true)
      window.removeEventListener('shameless-newsletter-signup', captureSignup)
    }
  }, [apiHost, choice, projectToken])

  return <>
    {choice === null && <aside aria-label="Analytics preferences" className="fixed bottom-24 left-4 right-4 z-[400] max-w-sm rounded-xl border border-stone-500 bg-stone-950 p-4 text-sm text-white shadow-lg md:bottom-4">
      <p className="mb-3">Allow website analytics to help Shameless understand visits and ticket-link clicks?</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded bg-white px-3 py-2 font-bold text-stone-950" type="button" onClick={() => setChoice('allow')}>Allow</button>
        <button className="rounded border border-stone-400 px-3 py-2" type="button" onClick={() => setChoice('decline')}>Decline</button>
        <a className="px-2 py-2 underline" href="/privacy#analytics">Privacy</a>
      </div>
    </aside>}
  </>
}
