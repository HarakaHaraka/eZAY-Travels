import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteHeader } from '@/components/home/SiteHeader';
import { BookingFlow } from '@/components/fares/BookingFlow';
import { canSellFlights } from '@/lib/accreditation';
import { config } from '@/lib/config';
import { flightGateway } from '@/lib/duffel';
import { insuranceQuote, priceOffer, priceStay } from '@/lib/offers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your booking', robots: { index: false, follow: false } };

export default async function OfferDetailPage({
  params,
  searchParams: _searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  // The blank-config guard: with no accreditation there is no bookable flight
  // product, so this route is not reachable — the enquiry form is the path.
  if (!canSellFlights()) {
    redirect('/enquiry');
  }

  const raw = await flightGateway().getOffer(decodeURIComponent(params.id));
  if (raw === null) notFound();

  const offer = priceOffer(raw);
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];

  const checkIn = outbound?.segments[0]?.arrivesAt.slice(0, 10) ?? '';
  const checkOut =
    inbound?.segments[0]?.departsAt.slice(0, 10) ??
    new Date(new Date(checkIn).getTime() + 3 * 86_400_000).toISOString().slice(0, 10);

  let stays: ReturnType<typeof priceStay>[] = [];
  try {
    const rawStays = await flightGateway().searchStays({
      destination: outbound?.destinationIata ?? '',
      checkIn,
      checkOut,
    });
    stays = rawStays.map(priceStay);
  } catch (error) {
    console.error('Stay search failed — continuing without hotels:', error);
  }

  const insurance = insuranceQuote(offer.passengerCount, offer.longHaul);

  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />
      <div className="wrap" style={{ padding: '32px clamp(16px, 2.4vw, 40px) 60px', maxWidth: 1000 }}>
        <Link href="/fares" style={{ fontSize: 14 }}>
          ← Back to results
        </Link>
        <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginTop: 10 }}>
          {outbound?.originIata} → {outbound?.destinationIata}
        </h1>
        <p style={{ color: 'var(--color-neutral-800)' }}>
          Nearly there. Passenger names, then anything you want to add, then payment.
        </p>

        <BookingFlow
          offerId={offer.id}
          passengerCount={offer.passengerCount}
          flightTotalMinor={offer.totalMinor}
          currency={offer.currency}
          breakdown={offer.breakdown}
          stays={stays.map((stay) => ({
            supplierStayId: stay.supplierStayId,
            name: stay.name,
            location: stay.location,
            nights: stay.nights,
            ratingStars: stay.ratingStars,
            sellMinor: stay.sellMinor,
          }))}
          insurance={{ description: insurance.description, sellMinor: insurance.sellMinor }}
        />
      </div>
    </>
  );
}
