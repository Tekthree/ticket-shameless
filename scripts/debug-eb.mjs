import { chromium } from 'playwright'

const browser = await chromium.connectOverCDP('http://localhost:9222')
const context = browser.contexts()[0]
const page = context.pages()[0]

await page.goto('https://www.eventbrite.com/o/12623653314', { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForTimeout(3000)

// Scroll to bottom
for (let i = 0; i < 10; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)
}

const result = await page.evaluate(() => {
  // Count event links
  const urls = new Set(
    [...document.querySelectorAll('a[href*="/e/"]')]
      .map(a => a.href.split('?')[0])
      .filter(u => /eventbrite\.com\/e\/[a-z0-9-]+-\d{8,}/.test(u))
  )

  // Look for any buttons/links that suggest pagination
  const btns = [...document.querySelectorAll('button, a')]
    .filter(el => /show more|load more|see more|view more|next/i.test(el.textContent))
    .map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 60), href: el.href ?? '' }))

  // Page bottom text
  const body = document.body.innerText
  const bottomText = body.slice(-500)

  return { count: urls.size, btns, bottomText }
})

console.log('Event count:', result.count)
console.log('Pagination buttons:', JSON.stringify(result.btns, null, 2))
console.log('\nBottom of page:\n', result.bottomText)

await browser.close()
