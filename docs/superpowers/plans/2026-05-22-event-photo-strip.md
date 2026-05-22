# Event Photo Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a horizontally-scrolling photo strip (Embla carousel, matching the home EventsSection style) to each upcoming event page, displayed right after the About/description block.

**Architecture:** Add a `gallery_images text[]` column to the `events` table. Expose it via the existing `Event` type in `lib/db.ts`. Build a self-contained `EventPhotoStrip` client component using the already-installed `embla-carousel-react`. Drop it into `EventPageClient.tsx` between the About block and the first `<Divider />`. Populate images for the 10 upcoming Deck'd Out events via a one-off seed script.

**Tech Stack:** Next.js 14 App Router, embla-carousel-react ^8.6.0, Neon (serverless Postgres), Cloudflare R2 (image storage), Tailwind/inline styles matching existing design system.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `scripts/migrate.mjs` | Add `gallery_images` column migration (idempotent) |
| Modify | `lib/db.ts` | Add `gallery_images: string[] \| null` to `Event` type |
| Create | `app/events/[slug]/EventPhotoStrip.tsx` | Embla carousel photo strip component |
| Modify | `app/events/[slug]/EventPageClient.tsx` | Import + render `EventPhotoStrip` after About block |
| Create | `scripts/seed-event-gallery.mjs` | Populate gallery_images for upcoming Deck'd Out events |

---

## Task 1: DB migration — add `gallery_images` column

**Files:**
- Modify: `scripts/migrate.mjs`

- [ ] **Step 1: Add idempotent migration at the bottom of migrate.mjs**

Open `scripts/migrate.mjs` and append this block before the final `console.log('Migration complete')` line (or at the bottom of the run function):

```js
// gallery_images: per-event photo strip URLs
await sql`
  ALTER TABLE events
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'
`
console.log('  gallery_images column OK')
```

- [ ] **Step 2: Run migration**

```bash
node scripts/migrate.mjs
```

Expected output includes: `gallery_images column OK`

- [ ] **Step 3: Verify in DB**

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'gallery_images'\`
  .then(r => console.log(r.length ? 'column exists' : 'MISSING'))
  .catch(console.error)
"
```

Expected: `column exists`

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate.mjs
git commit -m "feat: add gallery_images column to events table"
```

---

## Task 2: Update Event type in lib/db.ts

**Files:**
- Modify: `lib/db.ts` (around line 33 where `banner_url` is defined)

- [ ] **Step 1: Add gallery_images to the Event type**

In `lib/db.ts`, find the `Event` type block and add after `banner_url`:

```ts
gallery_images: string[] | null
```

The type block currently looks like:
```ts
export type Event = {
  ...
  banner_url: string | null
  // add here:
  gallery_images: string[] | null
  ...
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: add gallery_images field to Event type"
```

---

## Task 3: Build EventPhotoStrip component

**Files:**
- Create: `app/events/[slug]/EventPhotoStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import Image from 'next/image'
import { useRef, useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

const ALLOWED_HOST = 'pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

function safeUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    return hostname === ALLOWED_HOST ? url : null
  } catch { return null }
}

export default function EventPhotoStrip({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  return (
    <div style={{ margin: '28px 0' }}>
      {/* Carousel — bleeds to edge, matches EventsSection pattern */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {images.map((url, i) => {
              const safe = safeUrl(url) ?? url
              return (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: 260,
                    height: 200,
                    borderRadius: 'var(--ss-radius)',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#252220',
                  }}
                >
                  <Image
                    src={safe}
                    alt={`Event photo ${i + 1}`}
                    fill
                    sizes="260px"
                    style={{ objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}
                    className="ep-strip-img"
                  />
                </div>
              )
            })}
          </div>
        </div>
        {/* Right fade — same as EventsSection */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
          background: 'linear-gradient(to right, transparent, #1c1917)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            style={{
              width: 18,
              height: 5,
              border: 'none',
              borderRadius: 3,
              padding: 0,
              cursor: 'pointer',
              background: i === selectedIndex ? '#c9321a' : 'rgba(245,240,235,0.2)',
              transform: `scaleX(${i === selectedIndex ? 1 : 0.35})`,
              transformOrigin: 'center',
              transition: 'transform 0.25s ease, background 0.25s ease',
            }}
            aria-label={`Photo ${i + 1}`}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ep-strip-img:hover { transform: scale(1.04); }
      ` }} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add app/events/[slug]/EventPhotoStrip.tsx
git commit -m "feat: EventPhotoStrip — embla horizontal scroll photo strip for event pages"
```

---

## Task 4: Wire EventPhotoStrip into EventPageClient

**Files:**
- Modify: `app/events/[slug]/EventPageClient.tsx`

The About section ends around line 1083 (`{event.description && <DescriptionText text={event.description} />}`), followed immediately by `<Divider />` then RSVPSection.

- [ ] **Step 1: Add import at the top of EventPageClient.tsx**

After the existing imports (around line 7), add:

```tsx
import EventPhotoStrip from './EventPhotoStrip'
```

- [ ] **Step 2: Insert EventPhotoStrip after the description block**

Find this block in EventPageClient.tsx:
```tsx
            {event.description && (
              <DescriptionText text={event.description} />
            )}
          </div>

          {/* RSVP */}
          <Divider />
```

Replace with:
```tsx
            {event.description && (
              <DescriptionText text={event.description} />
            )}
            {event.gallery_images && event.gallery_images.length > 0 && (
              <EventPhotoStrip images={event.gallery_images} />
            )}
          </div>

          {/* RSVP */}
          <Divider />
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add app/events/[slug]/EventPageClient.tsx
git commit -m "feat: wire EventPhotoStrip into event page after About description"
```

---

## Task 5: Seed gallery images for upcoming Deck'd Out events

**Files:**
- Create: `scripts/seed-event-gallery.mjs`

The upcoming 2026 Deck'd Out events are already in the DB. For the photo strip, we'll reuse party photos already in R2 (gallery bucket objects). The script below sets 10 gallery image URLs per event — use existing R2 gallery images or the same R2 public URL pattern used elsewhere.

**Before running:** Choose 10 real R2 image URLs from the gallery bucket or upload photos first via the Cloudflare R2 dashboard. The placeholder URLs below should be replaced with real ones before committing.

- [ ] **Step 1: Upload 10 photos per event to R2**

Upload photos for each upcoming event into the R2 bucket under `events/{event-slug}/` using the Cloudflare dashboard or the existing `/api/upload` endpoint.

Name them `01.jpg` through `10.jpg`. The public URLs will follow the pattern:
```
https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev/events/{slug}/01.jpg
```

- [ ] **Step 2: Create the seed script**

```js
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const R2 = 'https://pub-d0e8a25adf7347f4aa8120dcaed15ac1.r2.dev'

function photos(slug, count = 10) {
  return Array.from({ length: count }, (_, i) =>
    `${R2}/events/${slug}/${String(i + 1).padStart(2, '0')}.jpg`
  )
}

const GALLERY = [
  { slug: 'deckd-out-1-season-opener-shvili-nyc-sky-rivers-la-all-vinyl',      images: photos('deckd-out-1-season-opener-shvili-nyc-sky-rivers-la-all-vinyl') },
  { slug: 'deckd-out-2-pride-edition-w-open-house-collective-idle',             images: photos('deckd-out-2-pride-edition-w-open-house-collective-idle') },
  { slug: 'deckd-out-3-off99-shameless-present-dj-said-sf-costa-showcase',      images: photos('deckd-out-3-off99-shameless-present-dj-said-sf-costa-showcase') },
  { slug: 'deckd-out-4-give-n-groove-shameless-present-headliner-tba-france',   images: photos('deckd-out-4-give-n-groove-shameless-present-headliner-tba-france') },
  { slug: 'deckd-out-5-shameless-presents-jason-peters-sf-best-butt-camp',      images: photos('deckd-out-5-shameless-presents-jason-peters-sf-best-butt-camp') },
  { slug: 'deckd-out-6-sassmouth-chi-nark-bottom-forty-has-catz',               images: photos('deckd-out-6-sassmouth-chi-nark-bottom-forty-has-catz') },
  { slug: 'deckd-out-7-sazn-shameless-present-mango-ginger-la-more',            images: photos('deckd-out-7-sazn-shameless-present-mango-ginger-la-more') },
  { slug: 'deckd-out-8-innerflight-shameless-feat-garth-wicked-nightmoves',     images: photos('deckd-out-8-innerflight-shameless-feat-garth-wicked-nightmoves') },
  { slug: 'deckd-out-9-flammable-shameless-pres-gene-hunt-traxchi-flamm-djs',  images: photos('deckd-out-9-flammable-shameless-pres-gene-hunt-traxchi-flamm-djs') },
  { slug: 'deckd-out-10-lnm-shameless-pres-cami-jones-ibiza-11-year-anniv',    images: photos('deckd-out-10-lnm-shameless-pres-cami-jones-ibiza-11-year-anniv') },
]

async function run() {
  for (const { slug, images } of GALLERY) {
    const result = await sql`
      UPDATE events SET gallery_images = ${images} WHERE slug = ${slug} RETURNING slug
    `
    if (result.length) console.log('  set', images.length, 'photos for', slug)
    else console.log('  NOT FOUND:', slug)
  }
  console.log('Done!')
}

run().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 3: Run after photos are uploaded**

```bash
node scripts/seed-event-gallery.mjs
```

Expected: `set 10 photos for deckd-out-1-...` × 10 events

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-event-gallery.mjs
git commit -m "feat: seed gallery images for 10 upcoming Deck'd Out events"
```

---

## Self-Review

**Spec coverage:**
- ✅ Horizontal scroll with Embla — Task 3
- ✅ Same effect as home EventsSection (dragFree, right fade gradient, dot indicators) — Task 3
- ✅ Placed right underneath the about description — Task 4
- ✅ 10 images per upcoming event — Task 5
- ✅ Current upcoming events only (10 Deck'd Out 2026) — Task 5
- ✅ DB storage for per-event images — Task 1 + 2

**Placeholder scan:** Task 5 Step 1 explicitly calls out that real R2 URLs must be uploaded before running the seed — this is intentional, not a placeholder bug.

**Type consistency:** `gallery_images: string[] | null` defined in Task 2, consumed as `event.gallery_images` in Task 4, passed as `images: string[]` prop in Task 3. Consistent throughout.
