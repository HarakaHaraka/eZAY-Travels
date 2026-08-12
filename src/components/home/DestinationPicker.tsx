'use client';

import Image from 'next/image';
import type { Band } from '@/lib/homepage';
import { formatMoneyWhole } from '@/lib/money';
import { useFareSelection } from './FareSelection';

/**
 * The interactive destination picker: a grid of photo tiles, one per
 * destination. Choosing a tile selects that destination's headline fare (so
 * the sticky fare bar updates) and jumps down to its band, where the fares,
 * hotels and transfers are laid out as one trip.
 *
 * This replaces the old "how we source" and "where we are" sections — that
 * copy now lives in the terms / compliance pages. The picker's job is to show,
 * at a glance, how the platform is structured and where partner inventory
 * (fares, stays, transfers) slots into each destination.
 */
export function DestinationPicker({ bands }: { bands: Band[] }) {
  const { selectOffer } = useFareSelection();

  if (bands.length === 0) return null;

  return (
    <section className="picker wrap" id="destinations" aria-labelledby="picker-heading">
      <div className="picker-head">
        <h2 id="picker-heading">Where could you go?</h2>
        <p>
          Tap a destination — we&rsquo;ll take you straight to its fares, hotels and transfers,
          priced together as one trip.
        </p>
      </div>

      <div className="picker-grid">
        {bands.map((band) => {
          const cheapest = band.offers.reduce<number | null>(
            (min, offer) => (min === null || offer.totalMinor < min ? offer.totalMinor : min),
            null
          );
          const headlineOfferId = band.offers[0]?.id ?? null;

          return (
            <a
              key={band.slug}
              className="pick"
              href={`#dest-${band.slug}`}
              // Selecting here drives the sticky fare bar, then the anchor
              // scrolls to the full band. Works without JS; this just enriches.
              onClick={() => {
                if (headlineOfferId) selectOffer(headlineOfferId);
              }}
            >
              <Image
                src={band.image}
                alt=""
                fill
                sizes="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 22vw"
                loading="lazy"
              />
              <span className="pick-ov" aria-hidden="true" />
              <span className="pick-txt">
                {band.tag && <span className={`tag ${band.tagTone}`}>{band.tag}</span>}
                <span className="pick-city">{band.city}</span>
                {cheapest !== null && (
                  <span className="pick-from">from {formatMoneyWhole(cheapest)}</span>
                )}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
