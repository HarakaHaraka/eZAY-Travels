import type { Metadata } from 'next';
import { EnquiryPanel } from '@/components/home/EnquiryPanel';
import { FareSelectionProvider } from '@/components/home/FareSelection';
import { HeroAndFareBar } from '@/components/home/HeroAndFareBar';
import { SiteHeader } from '@/components/home/SiteHeader';
import { PulseStrip } from '@/components/home/PulseStrip';
import { CredentialsSection } from '@/components/home/CredentialsSection';
import { SiteFooter } from '@/components/site/SiteFooter';
import { company } from '@/lib/config';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { canSellFlights } from '@/lib/accreditation';
import { cityBreakScenes } from '@/lib/cityBreaks';
import { pulseItems } from '@/lib/pulse';
import { config } from '@/lib/config';
import { loadHomepage } from '@/lib/homepage';

// Cache the homepage and refresh it every 5 minutes (ISR) rather than
// re-querying the database on every request. This makes the page fast and, on
// a free-tier host, resilient: a brief database hiccup serves the last good
// render instead of a 500. Seeded destination content changes rarely, so a
// few minutes of staleness is fine; admin edits appear within the window.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'eZAY Travels — flights to Africa, the Gulf, Türkiye and the Med, booked in a tap',
  description:
    'London flight agency for families, groups and independent travellers. Honest total prices, Apple Pay and Google Pay, a real person on WhatsApp. Flights to Africa, the Gulf, Türkiye and the Med.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const { scenes: guideScenes, offers } = await loadHomepage();
  // One rotating hero for every destination: photographed guides first, then
  // the city breaks still waiting for licensed imagery.
  const scenes = [...guideScenes, ...cityBreakScenes(config.contact.whatsapp)];
  const flightsBookable = canSellFlights();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'eZAY Travels and Tours Ltd',
    legalName: company.legalName,
    description:
      'London flight agency for families, groups and independent travellers. Honest total prices, Apple Pay and Google Pay, a real person on WhatsApp. Flights to Africa, the Gulf, Türkiye and the Med.',
    url: config.siteUrl,
    areaServed: 'GB',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '181 Barcombe Avenue',
      addressLocality: 'London',
      postalCode: 'SW2 3BH',
      addressCountry: 'GB',
    },
    email: config.contact.email,
    founder: { '@type': 'Person', name: 'Zainab Ahmed Husein' },
    knowsLanguage: ['en', 'so', 'sw', 'ar', 'it'],
    identifier: { '@type': 'PropertyValue', propertyID: 'Companies House', value: company.number },
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

      </FareSelectionProvider>

      <PulseStrip items={pulseItems(config.contact.whatsapp)} social={config.social} />

      <EnquiryPanel whatsappNumber={config.contact.whatsapp} />

      <CredentialsSection />

      <SiteFooter />

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        email={config.contact.email}
      />
    </>
  );
}
