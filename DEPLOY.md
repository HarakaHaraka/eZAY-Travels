# Getting eZAY Travels live on Render (with the domain)

## The one thing that fixes the "old / plain page"

The homepage photos and destination bands are **loaded from the database at
request time** — they are not hardcoded. So a Render service with **no seeded
database** renders a stripped-back page: no hero photos, no destinations.

Fixing it is: attach a Postgres database, load the data into it, redeploy.

---

## A. Fix the existing service (in place — least disruptive)

1. **Create the database.**
   Render dashboard → **New +** → **PostgreSQL** → Name `ezay-db` → **Free** →
   **Create Database**. When it's ready, copy the **Internal Database URL**.

2. **Point the web service at it, and set the rest of the config.**
   Your `ezay-travels` web service → **Environment** → add:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | *(the Internal Database URL from step 1)* |
   | `NODE_VERSION` | `22` |
   | `NEXT_PUBLIC_SITE_URL` | `https://ezaytravels.co.uk` |
   | `DUFFEL_API_KEY` | *(your Duffel **test** token)* |
   | `WHATSAPP_NUMBER` | *(your WhatsApp number, digits only, e.g. `447…`)* |
   | `COMPANY_PHONE` | *(your phone, e.g. `+44…`)* |
   | `NOTIFY_EMAIL` | `hello@ezaytravels.co.uk` |
   | `ADMIN_PASSWORD` | *(a strong password for the admin area)* |

   Leave **Stripe** and **ATOL** keys blank for now — that is deliberate and safe
   (checkout falls back to a demo path; no protection claim is shown until ATOL
   is confirmed in writing). Add Stripe **test** keys when the bank account is up.

3. **Set the build & start commands.**
   Service → **Settings**:
   - **Build Command:**
     ```
     npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run seed && npm run build
     ```
   - **Start Command:** `npm start`
   - **Branch:** `main` (confirm it is building `main`, not an old branch).

4. **Deploy fresh.**
   **Manual Deploy** → **Clear build cache & deploy**. Watch the log: you should
   see the Prisma migrations run and `Seed complete: 9 destination guides …`.

5. **Check it.** Open the `.onrender.com` URL — the rotating photo hero and the
   destination bands with photos should now be there.

> Seeding runs on every deploy. Once you start editing destination content in
> the admin area, remove `&& npm run seed` from the Build Command so your edits
> aren't overwritten on the next deploy.

---

## B. Or start clean from the blueprint

`render.yaml` in the repo root declares the web service **and** the database and
wires them together. Render → **Blueprints** → **New Blueprint Instance** →
point it at this repo. Then fill in the `sync: false` secrets (Duffel token,
admin password, etc.) in the dashboard. This creates its own `ezay-db` and
`ezay-travels`; if you already have a service by that name, use path A instead
to avoid duplicates.

---

## C. Point ezaytravels.co.uk at Render (domain is at 123-reg)

1. **In Render:** web service → **Settings** → **Custom Domains** → **Add** both
   `ezaytravels.co.uk` and `www.ezaytravels.co.uk`. Render will show you the DNS
   targets to create (an A record / ANAME-ALIAS for the bare domain, and a CNAME
   for `www` pointing at `ezay-travels.onrender.com`).

2. **In 123-reg:** Manage `ezaytravels.co.uk` → **Advanced DNS / Manage DNS**:
   - **www** → **CNAME** → `ezay-travels.onrender.com`
   - **@ (apex)** → the A record IP (or ANAME/ALIAS) Render gives you
   - Save. DNS can take a little while to propagate.

3. **Back in Render:** the domain rows flip to **Verified** and Render issues the
   HTTPS certificate automatically (free). Confirm `NEXT_PUBLIC_SITE_URL` is
   `https://ezaytravels.co.uk`, then redeploy so links/SEO use the real domain.

---

## Environment variables — full reference

See `.env.example`. For launch you only strictly need `DATABASE_URL` (site runs),
plus `DUFFEL_API_KEY` (real test fares instead of demo fixtures) and
`ADMIN_PASSWORD` (to reach the admin area). Everything else has safe defaults or
is intentionally blank until you're ready.
