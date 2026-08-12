import Link from 'next/link';
import type { PricedOffer } from '@/lib/offers';
import { formatDuration } from '@/lib/offers';
import { formatMoneyWhole } from '@/lib/money';

function time(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function day(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

/**
 * The design's offer-card anatomy, including the breakdown line that prints
 * our fee. That line is the positioning — it is never removed.
 */
export function OfferCard({
  offer,
  searchQuery,
  bookable,
  enquiryHref,
}: {
  offer: PricedOffer;
  searchQuery: string;
  bookable: boolean;
  enquiryHref: string;
}) {
  const carrier = offer.slices[0]?.segments[0];

  return (
    <article className="offer" style={{ cursor: 'default' }}>
      <div className="top">
        <span className="route">
          {offer.slices[0]?.originIata} → {offer.slices[0]?.destinationIata}
        </span>
        <span className={`tag ${offer.longHaul ? 'tag-accent-2' : 'tag-neutral'}`}>
          {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          {offer.slices.map((slice, index) => {
            const first = slice.segments[0];
            const last = slice.segments[slice.segments.length - 1];
            return (
              <div key={index} className="det" style={{ marginTop: index ? 4 : 0 }}>
                <strong style={{ fontFamily: 'var(--font-heading)' }}>
                  {time(first.departsAt)} — {time(last.arrivesAt)}
                </strong>{' '}
                {slice.originIata}→{slice.destinationIata} · {day(first.departsAt)} ·{' '}
                {formatDuration(slice.durationMinutes)}
              </div>
            );
          })}
          <div className="brk" style={{ marginTop: 6 }}>
            {carrier?.marketingCarrierName ?? carrier?.marketingCarrier}
            {offer.longHaul ? ' · long-haul' : ''}
          </div>
          {/* The fee line. Positioning — never remove. */}
          <div className="brk" style={{ fontWeight: 600 }}>
            {offer.breakdown}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="tot">{formatMoneyWhole(offer.perPassengerMinor)}</div>
          <div className="brk">per person</div>
          {offer.passengerCount > 1 && (
            <div className="brk">{formatMoneyWhole(offer.totalMinor)} total</div>
          )}
          <Link
            href={
              bookable
                ? `/fares/${encodeURIComponent(offer.id)}?${searchQuery}`
                : enquiryHref
            }
            className="btn btn-primary no-underline"
            style={{ marginTop: 8 }}
          >
            {bookable ? 'Select' : 'Book through us'}
          </Link>
        </div>
      </div>
    </article>
  );
}
