# eZAY Travels — platform

UK flights-first travel agency for festival travellers and long-haul independent travellers.
Next.js (App Router) + TypeScript + Tailwind + PostgreSQL via Prisma. Single app, deployable to
Vercel or Render.

---

## Read this first

Three rules shape most of the code. Breaking any of them is a bug, not a preference.

**1. Only one of three fare sources is programmable.** Duffel has an API; Faremine and the
ticketing partner (PTA) are trade portals a human books on and then logs here. So a manually
logged order is a first-class citizen — same `Order` record, same `EZY-` reference, same
confirmation document, same customer email. `createOrder({ orderType: 'manual' })` and
`createOrder({ orderType: 'api' })` differ in two string fields and nothing else.

**2. Accreditation is config, and blank config is safe.** Every protection claim, licence number
and statement comes from `src/lib/accreditation.ts`, which reads env. While `ATOL_HOLDER_NAME` or
`ATOL_NUMBER` is blank, `accreditationClaim()` returns `null` and `canSellFlights()` returns
`false` — so no claim can be rendered and no flight can be sold. It ships blank. The values are
**frozen onto the order at the time of sale**, so a later config change cannot rewrite what a past
customer was told.

Note what is *not* gated: hotel-only sales do not require ATOL. Gate the bundle, not the bed.

**3. Money is integer minor units, and totals are derived.** No floats touch an amount anywhere.
An order's `costMinor`/`markupMinor`/`totalMinor` are computed from its items by
`totalsFromItems()` — never passed in alongside them — so the total always equals the sum of the
lines. Every line stores cost, markup and price separately, so margin is a write-time fact.

---

## Running it

### Prerequisites

Node 20+, PostgreSQL 14+.

### Setup

```bash
npm install
cp .env.example .env          # then set DATABASE_URL and ADMIN_PASSWORD
createuser ezay --pwprompt --createdb
createdb ezay_travels -O ezay

npx prisma migrate dev        # creates the schema
npm run seed                  # guides, hotels and a sample enquiry
npm run dev                   # http://localhost:3000
```

Admin is at `/admin`, using `ADMIN_PASSWORD`.

### What the seed gives you

- **9 destination guides** — these are the homepage hero scenes, destination bands and offer
  cards. They were hardcoded in `design/index.html`; they now live in `DestinationGuide` so they
  are editable rather than in code.
- **18 hotels with 18 rates, every one a placeholder** (`verifiedAt: null`). The public site shows
  "Ask us" instead of a price, and the order API refuses to sell them. Verify a rate in
  `/admin/hotels` to make it sellable.
- **One enquiry, already past its 4-working-hour quote SLA**, so the overdue highlighting is
  visible immediately.

### Running without API keys

`DUFFEL_API_KEY`, `STRIPE_SECRET_KEY` and the email credentials can all be blank. Each degrades
independently and is clearly marked:

| Blank | What happens instead |
|---|---|
| `DUFFEL_API_KEY` | Fixture data rather than live search |
| `STRIPE_SECRET_KEY` | An in-app demo payment page that emits the same normalised `PaymentEvent` a real webhook does, through the same idempotency check |
| `SMTP_PASS` / `RESEND_API_KEY` | Email written to `.mail-outbox/` and logged |

The app **refuses to boot in production** with any of them blank — see `assertProductionReady()`
in `src/lib/config.ts`. A stand-in cannot reach a real customer.

### Tests

```bash
npm test
```

65 tests. Create `.env.test` with a `DATABASE_URL` pointing at a throwaway database and run
`npx prisma migrate deploy` against it first.

They cover exactly what CLAUDE.md asks for, plus the guards:

- **Three markup rules including the floor** — that the floor is per *ticket*, is applied *after*
  the percentage, and is a floor and never a cap.
- **The blank-config guard** — blank, partially populated and whitespace-only config all produce
  no claim and no sellable flight; hotel-only stays sellable.
- **Webhook idempotency** — a replay sends no second email, does not move `issuedAt`, and does not
  duplicate the payment.
- **Manual order creation** — same reference shape, same confirmation path as an API order.
- **Booking total equals the sum of its items** — per line and in aggregate, all integers.
- **Stripe isolation** — a source scan proving nothing outside `src/lib/payments/` imports the SDK,
  and that no card field exists anywhere. Both include a self-check so the scan cannot pass
  vacuously if its detector breaks.
- **Working-hours SLA** — weekends, out-of-hours arrivals and both DST transitions.

---

## Environment variables

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | **Yes** | Postgres connection string. |
| `DUFFEL_API_KEY` | prod | Duffel **test-mode** key. Blank ⇒ fixtures. |
| `STRIPE_SECRET_KEY` | prod | Stripe **test-mode** secret. Hosted checkout only — there is no card form anywhere. Blank ⇒ demo payment page. |
| `STRIPE_PUBLISHABLE_KEY` | no | Not needed for hosted checkout; kept for future use. |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Signing secret for `/api/webhooks/stripe`. Signatures are always verified. |
| `PAYMENT_MODE` | no | `stripe_direct` (default) or `collect_and_remit`, which additionally creates a `Remittance` per order. |
| `MARKUP_SHORT_HAUL_PCT` | no | **A fraction, not a percent**: `0.05` = 5%. |
| `MARKUP_LONG_HAUL_PCT` | no | Same. Long-haul is detected by duration (≥ 6h) or by a destination outside the short-haul region set. |
| `MARKUP_MIN_PER_TICKET_MINOR` | no | Hard floor per ticket in **pence**, applied after the percentage. `1500` = £15. |
| `MARKUP_PACKAGE_PCT` | no | Reserved for flight-inclusive packages. |
| `ATOL_HOLDER_NAME` | **ship blank** | Accreditation holder. |
| `ATOL_NUMBER` | **ship blank** | Licence number. |
| `ATOL_STATEMENT` | ship blank | The prescribed wording. In config because it is prescribed and may change. |
| `ATOL_SCOPE` | no | csv of `flight_only,package`. A product outside scope is not sellable even with a number present. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | prod | Microsoft 365, the primary transport. |
| `RESEND_API_KEY` | no | Alternative transport behind the same interface. |
| `NOTIFY_EMAIL` | no | Where enquiry notifications go. |
| `WHATSAPP_NUMBER` | no | International, no `+` or spaces. |
| `COMPANY_PHONE` | no | Displayed on the site. |
| `ADMIN_PASSWORD` | **Yes** | `/admin`. Compared in constant time; blank never matches. |
| `ADMIN_SESSION_SECRET` | prod | Signs the admin cookie. Falls back to `ADMIN_PASSWORD` in dev. |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URLs, sitemap and payment redirects. |
| `HERO_ROTATION_MS` | no | The single hero-rotation constant. Defaults to 5000. |

---

## The design

`design/index.html` and `design/styles.css` are the approved homepage and were ported, not
redesigned:

- `src/app/organic.css` is the component sheet, verbatim except that the Google Fonts `@import`
  was replaced with `next/font` (an `@import` is render-blocking and cannot be preloaded).
- `src/app/home.css` is the page layout, lifted verbatim from the design's `<style>` block.
- Tailwind serves the **admin only**, with preflight disabled so it cannot reset the design sheets.

Two things there are load-bearing:

1. `body { overflow-x: clip }` — **not** `hidden`, which silently kills the sticky fare bar.
2. The `prefers-reduced-motion` block kills the glow, the Ken Burns drift and the crossfade. The
   rotation timer is also stopped in JS, because CSS alone cannot stop a `setInterval`.

Images are local in `public/images/`, served through `next/image` with the first hero image
preloaded. **WebP only, deliberately** — AVIF encoding is serialised by the optimiser and stalled
the ~40 sidebar tiles for tens of seconds.

Photography licensing is tracked in `design/images/README.md`. Never add an image without adding
its row. Two need attention before launch: `hotel-eko-pool.jpg` carries a visible photographer
watermark and should be replaced with the property's media pack.

---

## What is built

- **Homepage** — ported design, data-driven from `DestinationGuide` and the `Hotel` registry.
- **Enquiry channel** — public form with honeypot and rate limiting, `ENQ-` reference,
  notification email, SLA deadlines stamped at creation.
- **Enquiry CRM** — pipeline board over the schema's stages, every change writing an
  `EnquiryEvent`, SLA timers in Europe/London working hours with overdue in red.
- **Payments** — `PaymentProvider` with `StripeDirect` and `CollectAndRemit`, webhook signature
  verification and idempotency.
- **Confirmation document** — PDF with the frozen protection values, emailed on payment success;
  failure sets `requires_attention` and never `confirmed`.
- **Admin** — dashboard (enquiries this week, conversion, attach rate, margin banked), order
  pipeline, per-order margin, manual order form with live margin, hotel registry with the
  placeholder guard, remittances.
- **Guides** — index and detail pages with `Article` JSON-LD and an enquiry CTA on every one.
- **SEO** — per-page metadata, Open Graph, `TravelAgency` JSON-LD on home, sitemap, robots.

## What is not built yet

- **Duffel live search and the `/fares` results page.** The gateway interface and the markup
  engine are done and tested, but the search UI is not, so the fare bar routes to the enquiry
  form. With accreditation blank there is nothing sellable at the end of a search anyway — but
  this is the next thing to build.
- **The attach step and online booking flow.** Blocked behind the same thing.
- **Duffel Stays.** Hotels come from the registry, not live inventory.
- **Transfers and partners admin.** The models exist and are migrated; there are no screens.
- **Rate limiting is in-process**, so it does not span instances. Behind more than one instance
  it wants moving to Redis.
