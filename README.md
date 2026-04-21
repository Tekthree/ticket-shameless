# Simply Shameless

[![Run Tests](https://github.com/tekthree/ticket-shameless/actions/workflows/run-tests.yml/badge.svg)](https://github.com/tekthree/ticket-shameless/actions/workflows/run-tests.yml)

Event platform and merch store for Shameless Productions, a Seattle-based electronic music collective. Partiful-style architecture: shareable event pages with RSVP, payment links for cover (Venmo/Cash App), and a Stripe-powered merch store.

**Live site (current, WordPress):** https://simplyshameless.com  
**Repo:** https://github.com/Tekthree/ticket-shameless

---

## What this is

A custom Next.js app replacing simplyshameless.com. The goal is a branded, fast, mobile-first platform where Shameless can:

- Post events and collect RSVPs (no ticket purchasing)
- Show a suggested cover price with a link to their Venmo/Cash App
- Sell merch directly via Stripe
- Build a newsletter subscriber list
- Blast RSVPs via Twilio SMS with event updates (Phase 4)

No third-party ticketing platforms. No commission on door sales. Design is inspired by Partiful: clean event pages, minimal friction to RSVP, easy to share.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Neon (serverless Postgres) |
| Image storage | Vercel Blob |
| Payments | Stripe (merch only) |
| SMS | Twilio (Phase 4) |
| Styling | Tailwind CSS + inline styles |
| Fonts | Barlow Condensed + DM Sans (via next/font) |
| Hosting | Vercel |

---

## Local setup

```bash
npm install
```

Create `.env.local`:

```
DATABASE_URL=postgresql://...           # from Neon dashboard
BLOB_READ_WRITE_TOKEN=...               # from Vercel Blob
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

The easiest way to get these is to link the project and pull:

```bash
npx vercel link
vercel env pull .env.local
```

Then run:

```bash
npm run dev
```

---

## Database setup

Schema is at `supabase/schema.sql` (pure Postgres, no Supabase-specific syntax).

1. Create a project at [neon.tech](https://neon.tech)
2. Open the SQL editor and paste/run the full schema
3. Copy the connection string and add it to `.env.local` as `DATABASE_URL`

### Tables

| Table | Purpose |
|---|---|
| `users` | Admin and guest accounts |
| `events` | Event pages: title, slug, date, venue, image, payment link, suggested price |
| `lineup` | Artists per event: name, bio, image, mix URL, time slot |
| `rsvps` | Per-event RSVPs: name, email, phone, status |
| `products` | Merch items: name, price, sizes, stock, Stripe price ID |
| `orders` + `order_items` | Stripe merch orders |
| `subscribers` | Newsletter signups |

### Key fields

- `events.payment_link` — Venmo/Cash App handle or URL. Displayed on the event page as a pay-cover CTA.
- `events.suggested_price` — optional suggested cover amount shown alongside the payment link.
- `rsvps.status` — `going`, `maybe`, or `not_going`. Unique on `(event_id, email)` so re-submitting updates in place.

---

## Project structure

```
app/
  page.tsx                # Homepage (server component — fetches events from DB)
  events/[slug]/          # Individual event pages
  api/
    checkout/             # Stripe merch checkout
    webhooks/             # Stripe webhook handler
    upload/               # Vercel Blob upload endpoint

components/
  home/
    HeroSection.tsx       # Full-screen hero
    Ticker.tsx            # Scrolling text marquee
    EventsSection.tsx     # Upcoming events grid
    GallerySection.tsx    # Asymmetric dark photo grid
    AboutSection.tsx      # Brand description block
    NewsletterSection.tsx # Email signup
    PageLoader.tsx        # Full-screen logo reveal animation
    HomeClient.tsx        # Client wrapper for PageLoader (needs useState)
  SSNavbar.tsx            # Branded scroll-aware navigation
  SSFooter.tsx            # Branded footer

lib/
  db.ts                   # All database queries via Neon
  events.ts               # Re-exports from db.ts

supabase/
  schema.sql              # Postgres schema — run in Neon SQL editor
```

---

## Phases

### Phase 1 — Homepage (in progress)

- [x] Hero section
- [x] Scrolling ticker
- [x] Events section (reads from DB)
- [x] Gallery section
- [x] About section
- [x] Newsletter signup
- [x] Page loader animation
- [ ] Mobile responsive polish

### Phase 2 — Event pages + RSVP

- [ ] `/events/[slug]` — full event detail page with lineup
- [ ] RSVP form (name, email, phone, status: going/maybe/not_going)
- [ ] Payment link display (Venmo/Cash App CTA with suggested price)
- [ ] Neon DB wired in production

### Phase 3 — Merch store

- [ ] `/merch` — product grid
- [ ] Stripe checkout for merch items
- [ ] Order confirmation page
- [ ] Admin: add/edit products, manage stock

### Phase 4 — SMS

- [ ] Twilio integration
- [ ] Blast to all RSVPs for a given event (updates, reminders)
- [ ] Opt-out handling

### Later

- [ ] Admin dashboard (create/edit events, view RSVPs, manage merch inventory)
- [ ] Photo upload via Vercel Blob
- [ ] Artist profile pages

---

## Design reference

Two designs were merged to build the current app.

**Design A** — `design-files/Simply Shameless.html`  
HTML/CSS prototype. Source for the page loader animation, gallery grid layout, and merch section visual style.

**Design B** — the original Next.js components in this repo  
Had the branded SSNavbar/SSFooter, Barlow Condensed + DM Sans fonts via next/font, Tailwind structure, and scroll-aware behavior.

The homepage now combines both.

---

## Notes

- No ticket purchasing. Events use RSVP + external payment links only. Stripe is for merch exclusively.
- Old test directories (`__tests__/tickets/`, `__tests__/payments/`, `__tests__/supabase/`, `__tests__/auth/`) are excluded from the test runner — they reference a deleted ticketing architecture. Write new tests in `__tests__/utils/` or new feature-specific directories.
- Some legacy components and routes still exist (`Header`, `Navbar`, `Footer`, `BuyTicketButton`, `app/box-office/`, `app/tickets/`, etc.) from the original ticketing app. These will be cleaned up as Phase 2+ is built.
