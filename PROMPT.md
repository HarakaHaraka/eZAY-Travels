# The Claude Code prompt

Open Claude Code in this repo and **paste the block below in one go.** It is
self-contained and designed to run autonomously. Everything it needs — the design,
the images, the data model, the rules — is already in the repo.

```
Read CLAUDE.md, prisma/schema.prisma, .env.example and design/index.html before you
write anything. They are the spec. Then build the eZAY Travels platform.

RUN AUTONOMOUSLY. Do not stop for approval between features. Build, run it, commit at
each working milestone, and report at the end with what works and what you could not
complete.

=== STACK ===
Next.js (App Router) + TypeScript + Tailwind + PostgreSQL via Prisma. Single app, not a
monorepo. Deploy target Vercel or Render. Secrets in .env, gitignored, .env.example kept
complete and current.

=== ORDER OF WORK ===
Scaffold and get it running -> Prisma migrate from the existing schema -> enquiry form
and CRM (this is the revenue channel, build it first) -> port the homepage design ->
Duffel search and results -> payments behind the interface -> booking and attach flow ->
confirmation document -> admin including manual orders -> hotel registry -> destination
guides -> SEO and accessibility pass. Commit at each.

=== 1. PORT THE HOMEPAGE ===
design/index.html and design/styles.css are the APPROVED design. Port them into React
components. Reuse the CSS custom properties and the .btn / .tag / .input / .field / .seg
classes as a global stylesheet — do not convert them to Tailwind utilities and do not
redesign anything. Keep exactly: the pale-sky palette, Caprasimo headings with Figtree
body, the rotating hero with its 1.4s crossfade and Ken Burns drift, the sticky fare bar
with its glow, the destination bands with photo panel plus two offer cards plus sidebar,
the sourcing panel, the dark enquiry panel, and the WhatsApp bubble.

Copy design/images/ to public/images/ and serve with next/image, srcset and lazy loading
below the hero. Preload the first hero image.

Honour prefers-reduced-motion: kill the glow, the Ken Burns drift and the crossfade.
The hero rotation interval is a single constant — default it to 5000ms.

CRITICAL: do not put overflow-x: hidden on any ancestor of the fare bar. It silently
kills position: sticky. Use overflow-x: clip if you need clipping.

The offer, scene and destination-band data in the design file is placeholder content.
Move it into the DestinationGuide model and seed it, so it becomes editable rather than
hardcoded.

=== 2. ENQUIRY FORM AND CRM — BUILD THIS FIRST ===
The enquiry form is the primary revenue channel at launch, not a fallback. Treat it as a
first-class product.

Public: the form from the design (name, mobile, trip free text, budget chips, WhatsApp
opt-in), plus honeypot and rate limiting, saving an Enquiry with a generated ENQ-
reference and emailing NOTIFY_EMAIL.

Admin CRM: a pipeline board over the Enquiry.stage values in the schema. Every stage
change writes an EnquiryEvent. Show an SLA timer — quote due within 4 working hours,
follow-ups due at day 2 and day 5 — and highlight overdue items in red. Working hours
means Mon-Fri 09:00-17:00 Europe/London; write and test that calculation properly,
including weekends.

=== 3. FARE SEARCH ===
Duffel in TEST mode via the official Node SDK. Search by origin, destination, dates,
passengers. Results list and offer detail, styled with the design's offer-card anatomy
including the breakdown line that prints our fee — that line is the positioning, never
remove it.

Markup from config: MARKUP_SHORT_HAUL_PCT, MARKUP_LONG_HAUL_PCT, and
MARKUP_MIN_PER_TICKET_MINOR as a hard floor applied after the percentage. Detect
long-haul by flight duration or region. Test all three rules including the floor.

Cache offer requests briefly and log searches per day — Duffel charges for excess
searches and a content-led site gets browsers before bookers.

If Duffel is unreachable, show the enquiry form and the phone number, never an error
page.

=== 4. THE ATTACH STEP — COMMERCIALLY ESSENTIAL, DO NOT SKIP ===
After flight selection and before payment, offer a hotel (Duffel Stays) and travel
insurance as add-ons. Default to showing them, not hiding them. Track attach rate as a
metric on the admin dashboard.

=== 5. PAYMENTS ===
Behind the interface described in CLAUDE.md. Two implementations: StripeDirect (hosted
checkout, eZAY merchant of record) and CollectAndRemit (hosted checkout plus a
Remittance record per licensable order). Select via PAYMENT_MODE, default stripe_direct.
Hosted checkout only, never a card form. Webhooks verify signatures and are idempotent.

=== 6. ACCREDITATION GUARD — SAFE WHEN BLANK ===
Implement exactly as CLAUDE.md describes and ship with ATOL_HOLDER_NAME and ATOL_NUMBER
blank. When blank: no protection claim renders anywhere on the site, in emails or on
documents, and flight checkout is disabled with the enquiry form presented as the path
forward. Freeze the values onto the Order at the time of sale. Write tests for the blank
state and the populated state.

=== 7. CONFIRMATION DOCUMENT ===
On payment success, email a confirmation PDF: reference, passengers, itinerary, itemised
price, and the protection holder, number and statement frozen on the order. Persist a
ConfirmationDocument keyed by idempotencyKey. If sending fails, the order must NOT show
as confirmed — set it to requires_attention and make that loud in admin.

=== 8. ADMIN ===
Password protected. Order pipeline covering both order types, with the MANUAL order form
given real care — it captures supplier, supplier reference, net cost, items, passengers
and payment, and triggers the same confirmation document. These are the highest-margin
bookings.

Also: margin view per order (cost vs sale vs markup vs attach revenue); hotel registry
CRUD with a loud PLACEHOLDER badge on any rate with a null verifiedAt and a hard block on
selecting one for a live sale; transfers; partners and tracking codes; settings for the
markup rules; remittance list when PAYMENT_MODE=collect_and_remit; and a dashboard
showing enquiries this week, conversion rate, attach rate and margin banked.

=== 9. HOTELS — MAKE THE SIDEBAR REAL ===
The "where to stay" rows in the design are currently invented. Replace them with real
data from the Hotel and HotelRate models, rendering the hotel image, name, distance note
and price, linking to bookingUrl. Seed with real properties for Cappadocia, Zanzibar,
Thailand, Nairobi, Lagos, Rome, the Alps and Palawan, each seeded with verifiedAt NULL so
they are visibly placeholders until a real quote is entered.

Note for the build: hotel-only sales do not require ATOL. Only flight-inclusive packages
do. So hotel-only booking must remain available even when the accreditation config is
blank — gate the bundle, not the bed.

=== 10. SEO AND TRUST ===
Per-page metadata and Open Graph. JSON-LD: TravelAgency on home, Article on destination
guides. Sitemap and robots.txt. Fast mobile Core Web Vitals. Semantic HTML, labelled
controls, keyboard navigable, contrast checked.

=== 11. EMAIL ===
Support SMTP via Microsoft 365 (SMTP_HOST/PORT/USER/PASS) as the primary transport, with
Resend as an alternative behind the same interface. Stub cleanly and log to console when
neither is configured.

=== CONSTRAINTS ===
Duffel and Stripe strictly TEST mode. Never store card data. Validate all input. Handle
upstream API errors with clear human messages. Seed script with the destination guides,
sample hotels and a sample enquiry. README with exact run instructions and every env var
explained.

Start now. Report when done.
```

---

## After it finishes

1. **Review the diff before you accept it.** Ask it to explain anything you don't follow.
2. **Check the blank-config guard works.** Load the site with `ATOL_NUMBER` empty and
   confirm there is no protection claim anywhere and flight checkout is disabled. This is
   the one test that keeps you legal.
3. **Check a manual order end to end.** Log a fake Faremine booking in admin and confirm
   it produces the same confirmation document as an online one.
4. `git push` to your linked repo.

## Follow-up prompts, one at a time

```
Add the destination guide content hub: MDX-driven guide pages with best booking window,
visa notes and budget bands, Article schema, internal links to the relevant offers, and
an enquiry CTA at the end of every guide. Seed three: Lagos, Cappadocia, Nairobi.
```

```
Add a /brand internal route holding the brand kit — logo and clear space, contrast pairs,
buttons and controls, offer-card anatomy. Keep it out of the sitemap and noindex it.
```

```
Deployment pass: Vercel config, env var checklist, database backup, health check, error
logging, and a smoke test covering enquiry -> manual order -> payment -> confirmation.
Write DEPLOY.md and list what I must do myself (DNS, live keys, Stripe activation).
```
