# Photography

Every image is a **local file in this folder**. Nothing hotlinks to a remote CDN —
that is what caused the black panels in the earlier build.

## What's here

| File | Used for | Source |
|---|---|---|
| `lagos.jpg` | Lagos hero + band | Seun Idowu · Unsplash |
| `cappadocia.jpg` | Cappadocia hero + band | Supplied by eZAY |
| `rome.jpg` | Rome hero + band | Supplied by eZAY |
| `paris.jpg` | Paris hero + band | Supplied by eZAY |
| `zanzibar.jpg` | Zanzibar hero + band | Supplied by eZAY |
| `alps.jpg` | Alps & ski hero + band | Supplied by eZAY |
| `thailand.jpg` | Thailand hero + band | Supplied by eZAY |
| `nairobi.jpg` | Nairobi hero + band | Grace Nandi · Unsplash |
| `palawan.jpg` | Palawan hero + Coastline scene | Supplied by eZAY |
| `hotel-eko-room.jpg` | Eko Hotel row, sidebar | Supplied by eZAY |
| `hotel-eko-pool.jpg` | Eko Hotel row, sidebar | Supplied by eZAY |
| `thumb-*.jpg` | Generic stay / transfer tiles | Generated — replace with supplier imagery |

## Two that need attention before launch

1. **`hotel-eko-pool.jpg` carries a visible photographer's watermark** ("Nana Kwadwo
   Duah"). It is fine while the site is unpublished, but ask Eko Hotels for their media
   pack when you open the commission conversation — they will send you clean, approved
   shots, and it costs one email.
2. **The `Z_nairobi` file you sent is the watermarked `independenttravelcats` image
   again — it is not in this folder and must not be used.** `nairobi.jpg` (Grace Nandi,
   Unsplash) is in its place and is properly licensed.

## The rule

Never add an image without adding a row to the table above with its source and licence.
**Attribution is not a substitute for a licence** — crediting a photographer whose work
you have no right to use does not make it lawful.

## Hotel imagery at scale

`thumb-*.jpg` are generated tiles standing in for property photography. Do not go and
collect hotel photos yourself. Real imagery arrives with the inventory:

- **Duffel Stays / bed banks** return image URLs in the API response, licensed for
  display under the supplier's terms → store in `Hotel.imageUrls`.
- **Direct-contracted hotels** send a media pack when you ask, in writing. Eko Hotels
  is the first of these.
- **Affiliate feeds** supply approved imagery too.
