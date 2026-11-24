const campaignFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export function newsletterAttribution(data: unknown) {
  if (!data || typeof data !== 'object') return {}
  const input = data as Record<string, unknown>
  const attribution: Record<string, string> = {}
  for (const key of campaignFields) {
    const value = input[key]
    if (typeof value === 'string' && /^[a-z0-9][a-z0-9 ._+~-]{0,119}$/i.test(value)) attribution[key] = value
  }
  if (typeof input.referrer === 'string' && /^[a-z0-9.-]{1,253}$/i.test(input.referrer)) {
    attribution.referrer = input.referrer.toLowerCase()
  }
  return attribution
}

export function currentNewsletterAttribution() {
  const params = new URLSearchParams(window.location.search)
  const values: Record<string, string | null> = Object.fromEntries(campaignFields.map(key => [key, params.get(key)]))
  if (document.referrer) {
    const host = new URL(document.referrer).hostname
    if (host.replace(/^www\./, '') !== window.location.hostname.replace(/^www\./, '')) values.referrer = host
  }
  const current = newsletterAttribution(values)
  try {
    const key = 'shameless-newsletter-source'
    const saved = newsletterAttribution(JSON.parse(window.sessionStorage.getItem(key) ?? 'null'))
    // Preserve the entry source when moving to another page in the same tab.
    const result = Object.keys(current).length ? { ...saved, ...current } : saved
    if (Object.keys(result).length) window.sessionStorage.setItem(key, JSON.stringify(result))
    return result
  } catch {
    return current
  }
}
