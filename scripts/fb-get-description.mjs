import { chromium } from 'playwright'

const browser = await chromium.connectOverCDP('http://localhost:9222')
const context = browser.contexts()[0]
const pages = context.pages()
const page = pages.find(p => p.url().includes('facebook.com/events')) ?? pages[0]

// Make sure we're on the Deck'd Out page
if (!page.url().includes('1734748337933522')) {
  await page.goto('https://www.facebook.com/events/1734748337933522/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  // Click See More
  try {
    await page.locator('text=See more').first().click({ timeout: 2000 })
    await page.waitForTimeout(800)
  } catch {}
}

// Try multiple description selectors and grab all substantial text blocks
const descData = await page.evaluate(() => {
  const candidates = []

  // Try various FB description containers
  const selectors = [
    '[data-ad-comet-preview="message"]',
    '[data-ad-preview="message"]',
    'div[class*="xdj266r"]',
    'div[class*="x11i5rnm"]',
    'div.xdj266r',
  ]

  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach(el => {
      const t = el.innerText?.trim()
      if (t && t.length > 50) candidates.push({ sel, text: t.slice(0, 500) })
    })
  }

  // Also grab all text nodes in the Details section by finding the "Details" heading
  const allDivs = Array.from(document.querySelectorAll('div'))
  const longTexts = allDivs
    .map(d => d.innerText?.trim())
    .filter(t => t && t.length > 100 && t.length < 2000 && /deck|party|season|house|techno|music|event/i.test(t))
    .slice(0, 5)

  return { candidates, longTexts }
})

console.log('Candidates:')
descData.candidates.forEach(c => console.log(`[${c.sel}]`, c.text))

console.log('\nLong text blocks containing relevant keywords:')
descData.longTexts.forEach((t, i) => console.log(`\n[${i}]`, t))

// Take a focused screenshot of the top portion
await page.screenshot({ path: '/home/tekthree/zoo-bot/fb-deckdout-detail.png', clip: { x: 0, y: 0, width: 800, height: 600 } })
console.log('\nTop screenshot saved')

await browser.close()
