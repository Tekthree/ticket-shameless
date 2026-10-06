# Content caching

Public page freshness: home and upcoming event listing 15 minutes; event detail,
past-event listing and DJ listing 1 hour; DJ profiles 24 hours. These are
request-driven regeneration intervals, not background timers. Time-sensitive
event listings retain a timed fallback so past events eventually roll off.

Public social counts and comments use a 15-minute Next.js data cache keyed by
event ID. Likes, RSVPs and comment writes invalidate the social cache. Personal
liked state is queried separately and responses containing it are private,
no-store. Past-event comments are fetched only after Show conversation is clicked.

## Refresh after external database edits

Before deploying, configure CACHE_REVALIDATION_SECRET as a strong random secret
in the hosting environment and the private environment of import tools. Do not
use a NEXT_PUBLIC variable. This is a new secret; it is not provisioned by this
code change.

After a successful event or DJ import/edit, POST to /api/revalidate on the site
with Authorization: Bearer <secret>. No body is required. A successful response
is {"revalidated":true}. This invalidates public event/DJ routes, listings,
sitemap and social caches; the next request regenerates content.

Existing external import tools must call this endpoint after their transaction
commits. Until those tools are wired up, changes appear through the timed
fallbacks above. Do not switch to indefinite caching without wiring every
publishing path, including direct SQL and agent imports.

From this repository, run `node scripts/revalidate-content.mjs` after an import.
It reads the secret from the private `.env.local` file or process environment.
Set SITE_URL to target a preview deployment; the default is the production site.

The endpoint returns 503 if unconfigured and 401 for invalid authorization.

## Verify savings after deployment

Compare Neon active hours/CU-hours and event-social traffic across comparable
days. Cache misses for different events and authenticated visits can still wake
the database; these changes do not guarantee suspension or a particular saving.
