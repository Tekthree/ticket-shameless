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
| Image storage | Cloudflare R2 |
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
STRIPE_SECRET_KEY=sk_...               # Stripe secret key (merch checkout)
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...  # Stripe publishable key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Used for Stripe redirect URLs

# Cloudflare R2 (image storage)
R2_ACCOUNT_ID=...                      # Cloudflare account ID
R2_ACCESS_KEY_ID=...                   # R2 API token access key
R2_SECRET_ACCESS_KEY=...              # R2 API token secret
R2_BUCKET=shameless-party-images       # bucket name
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxx.r2.dev  # from bucket Settings → Public Development URL
```

Then run:

```bash
npm run dev
```

---

## Database setup

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string and add it to `.env.local` as `DATABASE_URL`
3. Run migrations to create all tables:

```bash
npm run migrate
```

4. Seed sample events and merch:

```bash
npm run seed        # real events
npm run seed:merch  # sample products
```

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
| `djs` | DJ profiles: slug, name, bio, location, genres, social URLs, aliases, resident flag, profile image |

### DJ system

DJ profiles live in the `djs` table. Each profile has a `slug` (URL-safe), `aliases` (array of alternate billing names), and `is_resident` flag.

`lineup.dj_id` links a lineup entry to a profile. When linked, the event page displays `djs.name` (canonical) instead of the raw billing name.

**Data sources:** `scripts/data/dj-roster.json` (190 DJs from the Shameless DJ Roster Google Sheet), `scripts/data/dj-alias-map.json` (356 billing-name variants, A–J), `scripts/data/dj-merge-aliases.json` (16 aliases from the duplicate/merge log).

**Seeding and linking:**

```bash
# 1. Run the schema migration (adds aliases + is_resident columns)
npm run migrate:005

# 2. Seed all 190 DJ profiles (upsert-safe, uploads images to R2)
npm run seed:djs

# 3. Link lineup entries to profiles via name/alias matching, split B2B billings
npm run link:lineup
```

The alias map covers A–J (356 entries). K–Z billing variants will be matched by exact name only until the map is extended.

### Key fields

- `events.payment_link` — Venmo/Cash App handle or URL. Displayed on the event page as a pay-cover CTA.
- `events.suggested_price` — optional suggested cover amount shown alongside the payment link.
- `rsvps.status` — `going`, `maybe`, or `not_going`. Unique on `(event_id, email)` so re-submitting updates in place.

---

## Project structure

```
app/
  page.tsx                # Homepage (server component — fetches events from DB)
  events/
    page.tsx              # All events list page
    [slug]/               # Individual event detail pages
  shop/
    page.tsx              # Merch store grid
    success/              # Stripe checkout success page
  api/
    newsletter/           # POST — subscribe an email
    rsvp/                 # POST — create/update an RSVP
    checkout/merch/       # POST — create Stripe checkout session
    webhooks/stripe/      # POST — Stripe webhook (decrements stock)
    upload/               # POST — upload image to R2 (presign or direct)

components/
  home/
    HeroSection.tsx       # Full-screen hero (dynamic next-event card)
    Ticker.tsx            # Scrolling text marquee
    EventsSection.tsx     # Upcoming events grid
    GallerySection.tsx    # Asymmetric dark photo grid
    AboutSection.tsx      # Brand description block
    NewsletterSection.tsx # Email signup (wired to /api/newsletter)
    PageLoader.tsx        # Full-screen logo reveal animation
    HomeClient.tsx        # Client wrapper for PageLoader
  SSNavbar.tsx            # Branded scroll-aware navigation
  SSFooter.tsx            # Branded footer

lib/
  db.ts                   # All database queries + types via Neon
  events.ts               # Re-exports from db.ts
  r2.ts                   # Cloudflare R2 client, presign helper, public URL util

scripts/
  migrate.mjs             # Create all tables (idempotent)
  seed-real-events.mjs    # Seed production events
  seed-merch.mjs          # Seed sample merch products
```

---

## Phases

### Phase 1 — Homepage ✓

- [x] Hero section (next-event card pulls from DB)
- [x] Scrolling ticker
- [x] Events section (reads from DB)
- [x] Gallery section (live R2 images from bucket, falls back to placeholder)
- [x] About section
- [x] Newsletter signup (wired to `/api/newsletter`, saves to `subscribers` table)
- [x] Page loader animation
- [x] Mobile responsive polish — hero gradient, video zoom, dark crimson palette matching desktop

### Phase 2 — Event pages + RSVP ✓

- [x] `/events` — all events listing page
- [x] `/events/[slug]` — full event detail page with lineup
- [x] RSVP form (name, email, phone, status)
- [x] Payment link display (Venmo/Cash App CTA with suggested price)
- [x] Neon DB wired in production

### Phase 3 — Merch store ✓

- [x] `/shop` — product grid with size selector
- [x] Stripe checkout for merch items (`/api/checkout/merch`)
- [x] Order confirmation page (`/shop/success`)
- [x] Stripe webhook decrements stock on purchase
- [ ] Admin: add/edit products, manage stock

### Phase 4 — SMS

- [ ] Twilio integration
- [ ] Blast to all RSVPs for a given event (updates, reminders)
- [ ] Opt-out handling

### Later

- [ ] Admin dashboard (create/edit events, view RSVPs, manage merch inventory)
- [ ] Admin gallery upload UI (`/admin/gallery` — drag-and-drop to R2)
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

- No ticket purchasing. Events use RSVP + external payment links only. Stripe is merch-only.
- To register your Stripe webhook locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Run `npm run migrate` before `npm run dev` on a fresh Neon database.
- **R2 setup**: Cloudflare Dashboard → R2 Object Storage → Manage R2 API Tokens → Create Account API Token → Object Read & Write → specific bucket `shameless-party-images`. Copy the Access Key ID and Secret into `.env.local`. Your account ID is shown in the Cloudflare dashboard right sidebar.
- **R2 public URL**: In the bucket Settings → enable **Public Development URL** — copy the `pub-xxx.r2.dev` URL as `R2_PUBLIC_URL`. Add a CORS policy (Settings → CORS Policy) allowing GET + PUT from your site origins.
- **Upload API** supports two modes: `POST /api/upload?mode=presign` with `{ filename, contentType, folder }` → returns `{ uploadUrl, publicUrl, key }` for browser-direct upload to R2; `POST /api/upload` with `multipart/form-data` file field for server-side upload. Both return a public URL.
- **Gallery images**: `getGalleryImages()` in `lib/r2.ts` lists all objects from R2 and passes public URLs to `GallerySection`. Upload images directly via the Cloudflare R2 dashboard or the upload API to populate the gallery. Keys with spaces are URL-encoded automatically.
