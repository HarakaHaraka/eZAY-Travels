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
1. **Never store card data.** Stripe hosted Checkout only. No custom card form, ever.
2. **All money in integer minor units (pence).** Never floats. Store `cost`, `markup`
   and `sale` separately on every line — derive margin at write time, not report time.
3. **Payments sit behind an interface** (`createCheckout`, `handleWebhook`, `refund`,
   `getStatus`). No file outside the payments module may import the Stripe SDK. Enforce
   with a lint rule or a test.
4. **Accreditation config must be safe when blank.** Every protection claim, licence
   number and statement reads from env config — never hardcoded. If `ATOL_HOLDER_NAME`
   or `ATOL_NUMBER` is blank: render **no** protection claim anywhere, and disable flight
   checkout (the enquiry form still works and is presented as the path forward). **Ship
   with these blank.** Write tests proving the blank state behaves this way.
5. **No placeholder price may render publicly.** `HotelRate.verifiedAt == null` means
   placeholder. The public site must never show one.
6. **Secrets in `.env`, gitignored, with a complete `.env.example`.** Never commit a key.
7. **Duffel and Stripe strictly TEST mode** until told otherwise in writing.
8. **Webhooks verify signatures and are idempotent.** A replayed webhook must not send a
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
