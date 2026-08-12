import type { Metadata } from 'next';
import Link from 'next/link';
import { DestinationBands } from '@/components/home/DestinationBands';
import { DestinationPicker } from '@/components/home/DestinationPicker';
import { EnquiryPanel } from '@/components/home/EnquiryPanel';
import { FareSelectionProvider } from '@/components/home/FareSelection';
import { HeroAndFareBar } from '@/components/home/HeroAndFareBar';
import { SiteHeader } from '@/components/home/SiteHeader';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { canSellFlights } from '@/lib/accreditation';
import { config } from '@/lib/config';
import { loadHomepage } from '@/lib/homepage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'eZAY Travels — checked across three sources, fee on the line',
  description:
    'UK travel agency for festival and long-haul independent travellers. Every fare checked across three sources, our fee printed on the line. Quote back within four working hours.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const { scenes, bands, offers } = await loadHomepage();
  const flightsBookable = canSellFlights();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'eZAY Travels and Tours Ltd',
    description:
      'UK travel agency for festival travellers and long-haul independent travellers. Every fare checked across three sources, with our fee shown on the line.',
    url: config.siteUrl,
    areaServed: 'GB',
    address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
    telephone: config.contact.phone,
    email: config.contact.email,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <FareSelectionProvider offers={offers} initialOfferId={scenes[0]?.offerId ?? null}>
        <HeroAndFareBar
          scenes={scenes}
          rotationMs={config.heroRotationMs}
          flightsBookable={flightsBookable}
        />

        <section className="proof wrap" id="pricing">
          <div>
            <h3>3 sources</h3>
            <p>
              Every enquiry is checked across all three before we quote. You see which one we used.
            </p>
          </div>
          <div>
            <h3>4 hours</h3>
            <p>A written quote back inside four working hours. Not &ldquo;we&rsquo;ll get to it&rdquo;.</p>
          </div>
          <div>
            <h3>One number</h3>
            <p>
              Flight, hotel and cover priced together, with our fee on the line where you can see
              it.
            </p>
          </div>
        </section>

        <DestinationPicker bands={bands} />

        <DestinationBands bands={bands} />
      </FareSelectionProvider>

      <EnquiryPanel whatsappNumber={config.contact.whatsapp} phone={config.contact.phone} />

      <footer>
        EZAY TRAVELS AND TOURS LTD (trading as Ezay Travels) · Company No. 17394853 · 181 Barcombe
        Avenue, London SW2 3BH
        <br />
        <Link href="/terms">Terms, policies &amp; company information</Link> · Fares shown are
        examples — ask us and we&rsquo;ll price your dates properly.
      </footer>

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
