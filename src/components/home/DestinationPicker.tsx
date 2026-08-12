'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Band } from '@/lib/homepage';
import { formatMoneyWhole } from '@/lib/money';
import { useFareSelection } from './FareSelection';

/**
 * Interactive destination picker.
 *
 * Filter tabs (city breaks / beach & pool / festival / adventure) narrow a grid
 * of photo tiles. Choosing a tile selects that destination's headline fare (so
 * the sticky bar updates) and jumps to its band, where fares, hotels and
 * transfers are laid out as one trip. It replaces the old "how we source" and
 * "where we are" sections — that copy now lives on the /terms page.
 *
 * Categories are mapped by slug here rather than in the database so the content
 * team can keep editing destinations without a schema change; extend the map
 * when a new destination is seeded.
 */
const FILTERS = ['All', 'City breaks', 'Beach & pool', 'Festival', 'Adventure & ski'] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORIES: Record<string, Filter[]> = {
  lagos: ['Festival', 'City breaks'],
  cappadocia: ['Adventure & ski'],
  nairobi: ['City breaks'],
  zanzibar: ['Beach & pool'],
  thailand: ['Beach & pool', 'Adventure & ski'],
  rome: ['City breaks'],
  'alps-ski': ['Adventure & ski'],
  palawan: ['Beach & pool'],
  paris: ['City breaks'],
};

export function DestinationPicker({ bands }: { bands: Band[] }) {
  const { selectOffer } = useFareSelection();
  const [filter, setFilter] = useState<Filter>('All');

  const shown = useMemo(
    () =>
      filter === 'All' ? bands : bands.filter((b) => (CATEGORIES[b.slug] ?? []).includes(filter)),
    [bands, filter]
  );

  if (bands.length === 0) return null;

  return (
    <section className="picker wrap" id="destinations" aria-labelledby="picker-heading">
      <div className="picker-head">
        <h2 id="picker-heading">Where could you go?</h2>
        <p>
          Pick a mood or a season. Tap a place and we&rsquo;ll take you to its fares, hotels and
          transfers, priced together as one trip.
        </p>
      </div>

      <div className="picker-tabs" role="group" aria-label="Filter destinations by type">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            className={`picker-tab${filter === f ? ' on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="picker-grid">
        {shown.map((band) => {
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

      {shown.length === 0 && (
        <p className="picker-empty">
          More {filter.toLowerCase()} coming soon — ask us and we&rsquo;ll build one around your
          dates.
        </p>
      )}
    </section>
  );
}
