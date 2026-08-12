import 'server-only';
import { prisma } from './db';
import { toPublicImagePath } from './imagePath';

/**
 * The homepage view model, assembled from DestinationGuide (scenes, bands,
 * offer cards) and the Hotel registry (the "where to stay" rows).
 *
 * The "where to stay" rows in the original design were invented. They are now
 * real Hotel records, and a rate whose verifiedAt is null is a PLACEHOLDER —
 * so its price is withheld from the public site entirely.
 */

export interface OfferCard {
  id: string;
  route: string;
  totalMinor: number;
  city: string;
  out: string;
  back: string;
  badge: string;
  badgeTone: string;
  detail: string;
  /** The breakdown line that prints our fee. This is the positioning. */
  breakdown: string;
}

export interface StayRow {
  name: string;
  note: string;
  /** Null when the only rate is a placeholder — never show an invented price. */
  fromMinor: number | null;
  images: string[];
  bookingUrl: string | null;
}

export interface AroundRow {
  name: string;
  note: string;
  price: string;
  thumb: string;
}

export interface Scene {
  slug: string;
  chip: string;
  image: string;
  credit: string | null;
  kicker: string;
  headline: string;
  sub: string;
  offerId: string | null;
}

export interface Band {
  slug: string;
  city: string;
  tag: string;
  tagTone: string;
  heading: string;
  image: string;
  body: string;
  note: string;
  offers: OfferCard[];
  stays: StayRow[];
  around: AroundRow[];
}

export interface HomepageData {
  scenes: Scene[];
  bands: Band[];
  offers: Record<string, OfferCard>;
}

function creditLine(credit: string | null, licence: string | null): string | null {
  if (!credit) return null;
  // "Grace Nandi" + "Unsplash Licence" -> "Photo: Grace Nandi · Unsplash"
  if (licence && /unsplash/i.test(licence)) return `Photo: ${credit} · Unsplash`;
  return `Photo: ${credit}`;
}

export async function loadHomepage(): Promise<HomepageData> {
  const guides = await prisma.destinationGuide.findMany({
    where: { onHomepage: true, published: true },
    orderBy: { sortOrder: 'asc' },
  });

  const cities = Array.from(new Set(guides.map((g) => g.city)));
  const hotels = await prisma.hotel.findMany({
    where: { city: { in: cities }, active: true },
    include: { rates: true },
    orderBy: { createdAt: 'asc' },
  });

  const scenes: Scene[] = [];
  const bands: Band[] = [];
  const offers: Record<string, OfferCard> = {};

  for (const guide of guides) {
    const guideOffers = (guide.featuredOffers as unknown as OfferCard[] | null) ?? [];
    for (const offer of guideOffers) offers[offer.id] = offer;

    scenes.push({
      slug: guide.slug,
      chip: guide.chipLabel ?? guide.city,
      image: toPublicImagePath(guide.heroImage),
      credit: creditLine(guide.imageCredit, guide.imageLicence),
      kicker: guide.heroKicker ?? '',
      headline: guide.heroHeadline ?? guide.title,
      sub: guide.heroSub ?? '',
      offerId: guideOffers[0]?.id ?? null,
    });

    const cityHotels = hotels.filter((h) => h.city === guide.city);

    bands.push({
      slug: guide.slug,
      city: guide.city,
      tag: guide.bandTag ?? '',
      tagTone: guide.bandTagTone ?? 'tag-accent',
      heading: guide.city,
      image: toPublicImagePath(guide.heroImage),
      body: guide.bandBody ?? '',
      note: guide.bandNote ?? '',
      offers: guideOffers,
      stays: cityHotels.map((hotel) => {
        // A rate is only quotable publicly once someone has verified it.
        const verified = hotel.rates.filter((r) => r.verifiedAt !== null);
        const cheapest = verified.reduce<number | null>(
          (min, r) => (min === null || r.sellMinor < min ? r.sellMinor : min),
          null
        );
        return {
          name: hotel.name,
          note: hotel.distanceNote ?? '',
          fromMinor: cheapest,
          images: hotel.imageUrls.slice(0, 2).map(toPublicImagePath),
          bookingUrl: hotel.bookingUrl,
        };
      }),
      around: ((guide.gettingAround as unknown as AroundRow[] | null) ?? []).map((row) => ({
        ...row,
        thumb: toPublicImagePath(row.thumb),
      })),
    });
  }

  return { scenes, bands, offers };
}
