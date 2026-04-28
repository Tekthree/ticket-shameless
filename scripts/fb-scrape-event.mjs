// Scrape a specific FB event page via Min Browser CDP session
import { chromium } from 'playwright'

const EVENT_URL = 'https://www.facebook.com/events/1734748337933522/'

const browser = await chromium.connectOverCDP('http://localhost:9222')
const contexts = browser.contexts()
const context = contexts[0]

// Reuse the existing FB page and navigate it
const pages = context.pages()
const page = pages.find(p => p.url().includes('facebook.com')) ?? pages[0]
await page.goto(EVENT_URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)

// Click "See More" on description if present
try {
  const seeMore = page.locator('div[data-ad-comet-preview="message"] [role="button"]:has-text("See more"), [role="button"]:has-text("See More"), div[role="button"] >> text=See more').first()
  if (await seeMore.isVisible({ timeout: 2000 })) {
    await seeMore.click()
    await page.waitForTimeout(1000)
    console.log('Clicked See More')
  }
} catch {}

// Screenshot
await page.screenshot({ path: '/home/tekthree/zoo-bot/fb-deckdout-event.png', fullPage: true })
console.log('Screenshot saved')

// Extract event data
const data = await page.evaluate(() => {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() ?? null

  // Title: the main h1
  const title = document.querySelector('h1')?.innerText?.trim()

  // Date/time line — usually near the top of the event details
  const allText = document.body.innerText

  // Grab key structured elements
  const details = []
  document.querySelectorAll('[data-testid="event-permalink-details"] span, div[role="main"] span').forEach(el => {
    const t = el.innerText?.trim()
    if (t && t.length > 3 && t.length < 200) details.push(t)
  })

  // Look for ticket / RSVP link
  const ticketLink = Array.from(document.querySelectorAll('a[href]')).find(a =>
    /ticket|eventbrite|tixr|dice\.fm|ra\.co|venmo|paypal|payit|axs/i.test(a.href)
  )?.href ?? null

  // Description block — longest text block in the event
  let description = null
  document.querySelectorAll('[data-ad-comet-preview="message"], [data-ad-preview="message"], div[style*="white-space"]').forEach(el => {
    const t = el.innerText?.trim()
    if (t && (!description || t.length > description.length)) description = t
  })

  return { title, details: [...new Set(details)].slice(0, 30), description, ticketLink, url: location.href }
})

console.log('\n=== EVENT DATA ===')
console.log('Title:', data.title)
console.log('Ticket link:', data.ticketLink)
console.log('Description:', data.description?.slice(0, 300))
console.log('\nAll detail spans:')
data.details.forEach(d => console.log(' ', d))

await browser.close()
