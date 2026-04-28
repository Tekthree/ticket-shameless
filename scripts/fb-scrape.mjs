// Controls Min Browser via CDP - uses its existing FB login session
import { chromium } from 'playwright'
import fs from 'fs'

const PAGE_ID = '0A7F719295C15798AA7908E16A0F8EB4'

const browser = await chromium.connectOverCDP('http://localhost:9222')
const contexts = browser.contexts()
const context = contexts[0]
const pages = context.pages()

// Find the FB events tab
let page = pages.find(p => p.url().includes('facebook.com'))
if (!page) {
  page = await context.newPage()
  await page.goto('https://www.facebook.com/shamelessinseattle/events')
}

await page.bringToFront()
await page.waitForLoadState('domcontentloaded')

// Screenshot the events list
await page.screenshot({ path: '/home/tekthree/zoo-bot/fb-min-events.png', fullPage: false })
console.log('Screenshot saved to fb-min-events.png')

// Extract event links and basic data from the page
const events = await page.evaluate(() => {
  const results = []
  // Facebook event links in the events section
  const links = document.querySelectorAll('a[href*="/events/"]')
  const seen = new Set()
  for (const a of links) {
    const href = a.href
    const match = href.match(/\/events\/(\d+)/)
    if (!match) continue
    const id = match[1]
    if (seen.has(id)) continue
    seen.add(id)
    // Get nearby text content
    const container = a.closest('[role="article"]') ?? a.parentElement?.parentElement
    const text = container?.innerText ?? a.innerText
    results.push({ id, url: href, text: text.trim().slice(0, 200) })
  }
  return results
})

console.log('\nEvents found on FB:')
events.forEach(e => console.log(`  [${e.id}] ${e.text.split('\n')[0]}  →  ${e.url}`))

await browser.close()
