/**
 * Coerce a stored image reference to a public-folder absolute path.
 *
 * The homepage's imagery lives in the database — DestinationGuide.heroImage,
 * Hotel.imageUrls and the getting-around thumbs — and is rendered through
 * next/image. next/image REQUIRES a local `src` to begin with a leading slash;
 * handed a relative `images/lagos.jpg` it throws, and the panel renders blank.
 *
 * Every seeded path is already `/images/<name>.jpg`, so for a correctly seeded
 * database this is a no-op. It exists to survive one specific drift: a row
 * written by an earlier build that followed the design's relative convention
 * (design/index.html: ``const IMG = n => `images/${n}.jpg` ``). Coercing at the
 * point of use keeps a single legacy row from blanking the hero or a sidebar
 * tile on the deployed site — which is exactly the "photos exist but nothing
 * shows" symptom.
 *
 * Absolute paths (`/images/x.jpg`) and full URLs (`https://…`) pass through
 * untouched; a blank string stays blank so the caller can apply its own
 * fallback.
 */
export function toPublicImagePath(src: string): string {
  const trimmed = src.trim();
  if (trimmed === '') return '';
  if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) return trimmed;
  // Strip any leading `./` or `/` fragments, then anchor to the public root.
  return `/${trimmed.replace(/^(?:\.?\/)+/, '')}`;
}
