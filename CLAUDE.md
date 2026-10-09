# eZAY Travels — standing rules for Claude Code

## What this is
eZAY Travels and Tours Ltd — a UK flights-first travel agency for **festival travellers**
and **long-haul independent travellers**. Sells flights, and attaches hotels, airport
transfers, insurance and ancillaries to every booking, because flight margin alone is
too thin to build on. Acquisition is content-led.

## The single most important architectural fact
Fares come from **three** sources and only one of them is programmable:

| Route | API? | How a booking happens |
|---|---|---|
| **Duffel** | **Yes** — full API (flights + Stays) | Automated, in this app |
| **Faremine** | **No** — trade portal | A human books it on their portal, then **logs it here** |
| **Ticketing partner (PTA)** | **No** — trade portal | Same: booked elsewhere, logged here |

**A manually-logged order must be a first-class citizen** — same order record, same
reference, same confirmation document, same customer experience. The manual entry form
must be fast and pleasant to use. These are the *highest-margin* bookings; if the admin
makes them feel second-class, the best revenue gets the worst handling.

## Non-negotiables
1. **Never store card data.** No hand-built card form, ever.

   **Amended 9 October 2026, by the owner's written instruction.** Payment happens on
   eZAY's own page using Stripe's **Payment Element** — Stripe-hosted iframes mounted in
   our page. The customer never leaves ezaytravels.co.uk and no card detail reaches an
   eZAY server, so this is stricter than the old hosted-redirect rule, not looser. What
   stays forbidden is a card input of our own making.

   **And the money order is fixed: authorise → book → capture.** The PaymentIntent is
   created with `capture_method: 'manual'`, so the card is ring-fenced and nothing is
   taken. `/api/fares/confirm` then creates the Duffel order and captures ONLY if the
   ticket was issued; if Duffel refuses, the authorisation is released and the customer
   is charged nothing. If the ticket is issued but the capture fails, the order is marked
   `requires_attention` and is NEVER auto-cancelled — a cancelled ticket is a stranded
   traveller. eZAY is merchant of record and pays the airline from its own Duffel
   balance, so this ordering is the only thing standing between a customer and paying for
   a ticket that does not exist. `tests/bookBeforeCharge.test.ts` pins it.
2. **All money in integer minor units (pence).** Never floats. Store `cost`, `markup`
   and `sale` separately on every line — derive margin at write time, not report time.
3. **Payments sit behind an interface** (`createCheckout`, `handleWebhook`, `refund`,
   `getStatus`). No file outside the payments module may import the Stripe SDK. Enforce
   with a lint rule or a test.
4. **Accreditation config must be safe when blank.** Every protection claim, licence
   number and statement reads from env config — never hardcoded. If `ATOL_HOLDER_NAME`
   or `ATOL_NUMBER` is blank, render **no** protection claim anywhere. **Ship with these
   blank.** Write tests proving it.

   **Amended 9 October 2026, by the owner's written instruction.** Blank accreditation no
   longer disables flight checkout. eZAY sells **flight-only** tickets as a *disclosed
   agent* for the airline, issued instantly through Duffel, which sits outside the ATOL
   scheme — so card payment runs with no protection claim, and the site says plainly that
   the ticket is not ATOL protected and recommends travel insurance. `FLIGHT_ONLY_AGENT_MODE`
   now defaults **on**; set it to `false` to take checkout down. **Flight-inclusive packages
   stay blocked** until a real ATOL claim is configured — that guard is untouched, because a
   package genuinely does need an ATOL. If the CAA position or the insurer's view changes,
   flip the default back.

5. **The published fee page must match the code.** `/fees` describes what
   `src/lib/markup.ts` actually charges. Change both in the same commit, never one alone.
   The customer-facing price is the TOTAL including our fee; the fee is not itemised beside
   a Book button (it invites the customer to buy direct), but it is published in full on
   `/fees` and linked from the results header and the footer.
6. **No placeholder price may render publicly.** `HotelRate.verifiedAt == null` means
   placeholder. The public site must never show one.
7. **Secrets in `.env`, gitignored, with a complete `.env.example`.** Never commit a key.
8. **Duffel and Stripe strictly TEST mode** until told otherwise in writing.
9. **Webhooks verify signatures and are idempotent.** A replayed webhook must not send a
   second confirmation email.

## Design
`design/index.html` + `design/styles.css` are the **approved** homepage. Port them into
Next.js components — reuse the CSS custom properties, the `.btn` / `.tag` / `.input` /
`.field` / `.seg` classes and the exact colours, radii and motion timings. Do not
redesign. `design/images/` holds licensed photography; copy it to `public/images/`.

**Photography licensing:** `nairobi.jpg` is Unsplash (Grace Nandi) and its credit line is
in the scene data — keep it. The other three are owned. Never add an image without
recording its licence.

## Voice
UK English. Plain, warm, specific. Real numbers and real dates, never "unforgettable
experiences". Buttons say what happens.

## Process
Run autonomously — build, run it, commit at each working milestone, then report what
works and what you could not complete. Write tests for: the three markup rules including
the minimum floor, the blank-config guard, webhook idempotency, manual order creation,
and the booking total always equalling the sum of its items.
