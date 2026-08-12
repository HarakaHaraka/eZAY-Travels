import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { canSellFlights } from '@/lib/accreditation';
import { config } from '@/lib/config';
import { flightGateway } from '@/lib/duffel';
import { priceOffer, type PricedOffer } from '@/lib/offers';
import { recordSearch } from '@/lib/searchLog';
import { OfferCard } from '@/components/fares/OfferCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fare results',
  robots: { index: false, follow: true },
};

function iata(value: string): string {
  const match = value.trim().toUpperCase().match(/[A-Z]{3}(?!.*[A-Z]{3})/);
  return match ? match[0] : value.trim().toUpperCase().slice(0, 3);
}

export default async function FaresPage({
  searchParams,
}: {
  searchParams: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    pax?: string;
    trip?: string;
  };
}) {
  const originRaw = searchParams.origin ?? 'London LON';
  const destinationRaw = searchParams.destination ?? '';
  const departureDate =
    searchParams.departureDate ??
    new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10);
  const returnDate =
    searchParams.trip === 'oneway'
      ? undefined
      : (searchParams.returnDate ??
        new Date(Date.now() + 52 * 86_400_000).toISOString().slice(0, 10));
  const passengerCount = Math.min(9, Math.max(1, Number(searchParams.pax ?? 1) || 1));

  const origin = iata(originRaw);
  const destination = iata(destinationRaw);
  const bookable = canSellFlights();

  const enquiryHref = `/enquiry?origin=${encodeURIComponent(originRaw)}&destination=${encodeURIComponent(
    destinationRaw
  )}&pax=${passengerCount}${returnDate ? '' : '&trip=oneway'}`;

  let offers: PricedOffer[] = [];
  let failed = false;

  if (destination.length === 3) {
    recordSearch();
    try {
      const raw = await flightGateway().searchOffers({
        origin,
        destination,
        departureDate,
        returnDate,
        passengerCount,
      });
      offers = raw.map(priceOffer).sort((a, b) => a.totalMinor - b.totalMinor);
    } catch (error) {
      console.error('Fares page search failed:', error);
      failed = true;
    }
  }

  const searchQuery = new URLSearchParams({
    origin: originRaw,
    destination: destinationRaw,
    departureDate,
    pax: String(passengerCount),
    ...(returnDate ? { returnDate } : { trip: 'oneway' }),
  }).toString();

  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <div className="wrap" style={{ padding: '32px clamp(16px, 2.4vw, 40px) 60px', maxWidth: 1000 }}>
        <Link href="/#top" style={{ fontSize: 14 }}>
          ← New search
        </Link>

        <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginTop: 10 }}>
          {origin} → {destination || '…'}
        </h1>
        <p style={{ color: 'var(--color-neutral-800)' }}>
          {departureDate}
          {returnDate ? ` — ${returnDate}` : ' · one way'} · {passengerCount} traveller
          {passengerCount > 1 ? 's' : ''}
        </p>

        {!bookable && offers.length > 0 && (
          <div
            style={{
              marginTop: 20,
              padding: 18,
              borderRadius: 22,
              background: 'var(--color-surface)',
              maxWidth: '62ch',
            }}
          >
            <strong>These are real prices — booking is by enquiry for now.</strong>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--color-neutral-800)' }}>
              Card payment for flights isn&rsquo;t switched on yet. Pick the one you like and
              we&rsquo;ll book it for you directly — same fare, same day, a message in between.
            </p>
          </div>
        )}

        {destination.length !== 3 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: 'var(--color-neutral-800)' }}>
              Pick a destination on the home page, or tell us where you want to go.
            </p>
            <Link href="/enquiry" className="btn btn-primary no-underline" style={{ marginTop: 12 }}>
              Send an enquiry
            </Link>
          </div>
        )}

        {failed && (
          <div style={{ marginTop: 24, padding: 20, borderRadius: 26, background: 'var(--color-surface)' }}>
            <h2 style={{ fontSize: 19 }}>We couldn&rsquo;t reach the fare system</h2>
            <p style={{ color: 'var(--color-neutral-800)' }}>
              That&rsquo;s on us. Try again in a moment, or let us price it by hand — which we&rsquo;d
              probably do anyway on a route like this.
            </p>
            <Link href={enquiryHref} className="btn btn-primary no-underline" style={{ marginTop: 10 }}>
              Price it by hand
            </Link>
          </div>
        )}

        {!failed && destination.length === 3 && offers.length === 0 && (
          <div style={{ marginTop: 24, padding: 20, borderRadius: 26, background: 'var(--color-surface)' }}>
            <h2 style={{ fontSize: 19 }}>Nothing came back for those dates</h2>
            <p style={{ color: 'var(--color-neutral-800)' }}>
              Often means the route needs a connection we build by hand. Send it over and we&rsquo;ll
              look properly.
            </p>
            <Link href={enquiryHref} className="btn btn-primary no-underline" style={{ marginTop: 10 }}>
              Ask us to price it
            </Link>
          </div>
        )}

        {offers.length > 0 && (
          <>
            <p style={{ marginTop: 22, fontSize: 13, color: 'var(--color-neutral-700)' }}>
              {offers.length} fares, cheapest first. Prices include our fee, shown on each.
            </p>
            <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  searchQuery={searchQuery}
                  bookable={bookable}
                  enquiryHref={enquiryHref}
                />
              ))}
            </div>

            <div style={{ marginTop: 28, padding: 20, borderRadius: 26, background: 'var(--color-surface)' }}>
              <h2 style={{ fontSize: 19 }}>None of these quite right?</h2>
              <p style={{ color: 'var(--color-neutral-800)', maxWidth: '60ch' }}>
                We also price every trip through two trade consolidators that don&rsquo;t publish
                fares online. On long-haul they win often enough to be worth asking.
              </p>
              <Link href={enquiryHref} className="btn btn-secondary no-underline" style={{ marginTop: 10 }}>
                Check the trade fares
              </Link>
            </div>
          </>
        )}
      </div>

      <footer>eZAY Travels and Tours Ltd · London · Fares are live at time of search.</footer>

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
