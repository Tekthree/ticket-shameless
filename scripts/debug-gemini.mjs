/**
 * Debug: call Gemini for ONE event and dump the raw response to see what's happening
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })
if (!process.env.GEMINI_API_KEY) config({ path: '/home/tekthree/zoo-bot/.env', override: false })

const sql = neon(process.env.DATABASE_URL)
const GEMINI_KEY = process.env.GEMINI_API_KEY

console.log('GEMINI_KEY set:', !!GEMINI_KEY)

// Get one event
const [ev] = await sql`
  SELECT e.id, e.title, e.date, e.venue, e.tags, e.presented_by, e.suggested_price, e.image_url, e.banner_url,
    coalesce(json_agg(json_build_object('name', l.name, 'is_headliner', coalesce(l.is_headliner,false)) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') AS lineup
  FROM events e
  LEFT JOIN lineup l ON l.event_id = e.id
  WHERE e.title = 'The Breakfast Club 2026'
  GROUP BY e.id
  LIMIT 1
`

console.log('Event:', ev.title)

// Build prompt
const date = new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })
const lineupLines = ev.lineup.map(a => `• ${a.name}${a.is_headliner ? ' — HEADLINER' : ''}`).join('\n')
const textPrompt = `EVENT: ${ev.title}\nDATE: ${date}\nVENUE: ${ev.venue ?? 'Monkey Loft'}\nLINEUP:\n${lineupLines}`

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`
const body = {
  contents: [{ role: 'user', parts: [{ text: textPrompt }] }],
  generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
  systemInstruction: {
    parts: [{ text: 'Write a 2-4 paragraph event description (150-250 words) for this Seattle underground house/techno event. Sound like the promoter. Lowercase-friendly. No hype phrases. Output ONLY the description.' }]
  }
}

const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const data = await res.json()

// Dump full raw response
writeFileSync('/tmp/gemini-debug.json', JSON.stringify(data, null, 2), 'utf8')
console.log('\nRaw response dumped to /tmp/gemini-debug.json')
console.log('Status:', res.status)
console.log('Candidates:', data.candidates?.length)
console.log('Parts:', data.candidates?.[0]?.content?.parts?.length)
console.log('Finish reason:', data.candidates?.[0]?.finishReason)

// Show each part
const parts = data.candidates?.[0]?.content?.parts ?? []
for (let i = 0; i < parts.length; i++) {
  const p = parts[i]
  const isThought = p.thought === true
  console.log(`\nPart ${i}: thought=${isThought}, text length=${p.text?.length ?? 0}`)
  if (!isThought && p.text) {
    console.log('--- TEXT START ---')
    console.log(p.text)
    console.log('--- TEXT END ---')
  }
}

// What the current code extracts
const joined = parts.map(p => p.text ?? '').join('').trim()
console.log('\nJoined all parts length:', joined.length)

// Filter out thought parts
const outputOnly = parts.filter(p => !p.thought).map(p => p.text ?? '').join('').trim()
console.log('Output-only (no thoughts) length:', outputOnly.length)
console.log('\nOutput text:')
console.log(outputOnly)
