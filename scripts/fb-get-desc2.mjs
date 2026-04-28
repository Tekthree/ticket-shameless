import { chromium } from 'playwright'

const browser = await chromium.connectOverCDP('http://localhost:9222')
const context = browser.contexts()[0]
const pages = context.pages()
const page = pages.find(p => p.url().includes('facebook.com')) ?? pages[0]

// Make sure we're on the right page
const url = page.url()
console.log('Current URL:', url)

if (!url.includes('1734748337933522')) {
  await page.goto('https://www.facebook.com/events/1734748337933522/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
}

// Click See More if present
try {
  const btn = page.locator('div[role="button"]:has-text("See more")').first()
  if (await btn.isVisible({ timeout: 2000 })) {
    await btn.click()
    await page.waitForTimeout(1000)
    console.log('Clicked See more')
  }
} catch {}

// Get all text from the main content area, focusing on the right column
const result = await page.evaluate(() => {
  // Get the main event content - look for the "Details" section text
  const mainEl = document.querySelector('[role="main"]')
  if (!mainEl) return { error: 'no main element' }

  // Find spans that look like description content
  const allText = mainEl.innerText

  // Find elements after "Details" heading
  const headings = Array.from(mainEl.querySelectorAll('h2, h3, [role="heading"]'))
  const detailsHeading = headings.find(h => h.innerText?.trim() === 'Details')

  let descriptionText = null
  if (detailsHeading) {
    // Walk siblings after Details
    let el = detailsHeading.parentElement?.nextElementSibling
    for (let i = 0; i < 5 && el; i++) {
      const t = el.innerText?.trim()
      if (t && t.length > 30) {
        descriptionText = t
        break
      }
      el = el.nextElementSibling
    }
  }

  // Also try: look for the longest single text node in main
  const textBlocks = Array.from(mainEl.querySelectorAll('div, span, p'))
    .map(el => ({ tag: el.tagName, text: el.innerText?.trim() }))
    .filter(b => b.text && b.text.length > 80 && b.text.length < 1500)
    .filter(b => !/^(Going|Interested|Invite|Edit|Discussion|About|Guests|Tickets|Details|Followers)/i.test(b.text))
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 3)

  return { descriptionText, textBlocks, mainTextPreview: allText.slice(0, 2000) }
})

console.log('\n=== DESCRIPTION HEADING APPROACH ===')
console.log(result.descriptionText)

console.log('\n=== TOP TEXT BLOCKS ===')
result.textBlocks?.forEach((b, i) => console.log(`\n[${i}] (${b.tag}, ${b.text.length} chars):\n${b.text.slice(0, 400)}`))

console.log('\n=== MAIN TEXT PREVIEW ===')
console.log(result.mainTextPreview)

// Screenshot the details area - scroll down a bit
await page.evaluate(() => window.scrollBy(0, 400))
await page.waitForTimeout(500)
await page.screenshot({ path: '/home/tekthree/zoo-bot/fb-deckdout-scroll.png', clip: { x: 400, y: 0, width: 700, height: 700 } })
console.log('\nScrolled screenshot saved')

await browser.close()
