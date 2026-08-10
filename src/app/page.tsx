import type { Metadata } from 'next';
import { CredentialsSection } from '@/components/home/CredentialsSection';
import { DestinationBands } from '@/components/home/DestinationBands';
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

        <section className="proof wrap">
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

        <DestinationBands bands={bands} />
      </FareSelectionProvider>

      <CredentialsSection />

      <section className="sourcing wrap" id="sourcing">
        <h2>How we source your fare</h2>
        <p className="intro">
          Three places a fare can come from, and we check all of them before we send you a number.
          Then we tell you which one we used and what we made on it — because you&rsquo;ll find out
          eventually, and it&rsquo;s better coming from us.
        </p>
        <div className="steps">
          <div className="step">
            <div className="n">1</div>
            <h4>The live search</h4>
            <p>
              Real-time airline pricing, the same feed the big sites use. Fast, and honest on
              short-haul.
            </p>
          </div>
          <div className="step">
            <div className="n">2</div>
            <h4>Trade net fares</h4>
            <p>
              Consolidator pricing you can&rsquo;t see publicly. On long-haul this is usually where
              your saving comes from.
            </p>
          </div>
          <div className="step">
            <div className="n">3</div>
            <h4>Our ticketing partner</h4>
            <p>
              Ticketed and issued through an accredited partner. We tell you which fare we used and
              what we made on it.
            </p>
          </div>
        </div>
      </section>

      <EnquiryPanel whatsappNumber={config.contact.whatsapp} phone={config.contact.phone} />

      <footer>
        eZAY Travels and Tours Ltd · London · Fares are examples. Ask us and we&rsquo;ll price your
        dates properly.
      </footer>

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
