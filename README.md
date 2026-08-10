# eZAY Travels — platform

UK flights-first travel agency. Festival travellers and long-haul independent travellers.

## What's in here
| Path | What it is |
|---|---|
| `CLAUDE.md` | Standing rules — Claude Code reads this automatically |
| `PROMPT.md` | **Start here.** The master build prompt to paste |
| `prisma/schema.prisma` | The data model. Build to it |
| `design/index.html` | The approved homepage. Open it in a browser |
| `design/styles.css` | Design tokens and component classes |
| `design/images/` | All photography — local files, no hotlinks. See its README |
| `.env.example` | Every environment variable, explained |

## Getting started
```bash
git init && git add -A && git commit -m "eZAY: design, schema and build spec"
git remote add origin <your-repo-url> && git push -u origin main
claude          # then paste the block from PROMPT.md
```

## Photography — run this first
Six of the ten destination images ship as generated stand-ins, because the build
environment could not reach Unsplash. Get the real ones in ten seconds:

```bash
cd design/images
bash fetch-photos.sh                                       # macOS / Linux / Git Bash
powershell -ExecutionPolicy Bypass -File fetch-photos.ps1  # Windows
```

Full licence table and credits: `design/images/README.md`. **Never add an image without
adding a row there.** On a travel site, someone eventually asks — and attribution is not
a substitute for a licence.

## Domain and email
1. Buy the domain (`ezaytravels.co.uk`, and the `.com` as cheap insurance).
2. In Microsoft 365 admin, add the domain and follow the DNS records it gives you —
   TXT to verify, then MX, plus the SPF TXT record, and enable DKIM.
3. Add a DMARC TXT record starting at `p=none` so you can watch reports before enforcing.
4. Create `hello@`. Use it as `SMTP_USER` and `NOTIFY_EMAIL`. Generate an app password
   if the account has MFA on — it should.
5. Point the apex and `www` at your host once the app is deployed.

## Compliance reminders
- **Ship with `ATOL_HOLDER_NAME` and `ATOL_NUMBER` blank.** Blank means no protection
  claim renders and flight checkout is disabled. That guard is what stops you shipping a
  claim you cannot honour — do not defeat it to demo something.
- **Hotel-only needs no ATOL.** Only flight-inclusive packages do. Gate the bundle, not
  the bed.
- **Never store card data.** Stripe hosted checkout only.
- **No price publishes without a real supplier quote behind it** — `verifiedAt` must not
  be null.
