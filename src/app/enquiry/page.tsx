import type { Metadata } from 'next';
import { EnquiryPanel } from '@/components/home/EnquiryPanel';
import { SiteHeader } from '@/components/home/SiteHeader';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { flightCheckoutBlockedReason } from '@/lib/accreditation';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Get a quote',
  description:
    'Tell us where and when. We check every fare source we have and come back with a real number inside four working hours.',
  alternates: { canonical: '/enquiry' },
};

export default function EnquiryPage({
  searchParams,
}: {
  searchParams: { origin?: string; destination?: string; pax?: string; trip?: string };
}) {
  const blocked = flightCheckoutBlockedReason();

  // Carry whatever the fare bar knew into the message, so nobody retypes it.
  const parts: string[] = [];
  if (searchParams.origin && searchParams.destination) {
    parts.push(`${searchParams.origin} to ${searchParams.destination}`);
  }
  if (searchParams.pax) {
    const pax = Number(searchParams.pax);
    parts.push(`${pax} ${pax === 1 ? 'traveller' : 'travellers'}`);
  }
  if (searchParams.trip === 'oneway') parts.push('one way');
  const prefill = parts.length > 0 ? `${parts.join(', ')}. Dates: ` : '';

  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <div className="wrap" style={{ padding: '48px clamp(16px, 2.4vw, 40px) 0' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', maxWidth: '18ch' }}>
          Tell us the trip. We&rsquo;ll come back with a real number.
        </h1>
        <p style={{ maxWidth: '56ch', fontSize: 17, color: 'var(--color-neutral-800)' }}>
          We check the live search, the trade net fares and our ticketing partner before we quote —
          then tell you which one we used and what we made on it.
        </p>

        {blocked && (
          <div
            style={{
              maxWidth: '62ch',
              marginTop: 24,
              padding: 20,
              borderRadius: 26,
              background: 'var(--color-surface)',
            }}
          >
            <h2 style={{ fontSize: 19, marginBottom: 6 }}>How booking works right now</h2>
            <p style={{ margin: 0, fontSize: 14.5, color: 'var(--color-neutral-800)' }}>{blocked}</p>
          </div>
        )}
      </div>

      <EnquiryPanel
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        prefillTrip={prefill}
      />

      <footer>
        eZAY Travels and Tours Ltd · London · A person answers every enquiry within four working
        hours.
      </footer>

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
