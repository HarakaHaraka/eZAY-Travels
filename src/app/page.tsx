import type { Metadata } from 'next';
import { DestinationBands } from '@/components/home/DestinationBands';
import { DestinationPicker } from '@/components/home/DestinationPicker';
import { EnquiryPanel } from '@/components/home/EnquiryPanel';
import { FareSelectionProvider } from '@/components/home/FareSelection';
import { HeroAndFareBar } from '@/components/home/HeroAndFareBar';
import { SiteHeader } from '@/components/home/SiteHeader';
import { CityBreaks } from '@/components/home/CityBreaks';
import { CredentialsSection } from '@/components/home/CredentialsSection';
import { SiteFooter } from '@/components/site/SiteFooter';
import { company } from '@/lib/config';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { canSellFlights } from '@/lib/accreditation';
import { config } from '@/lib/config';
import { loadHomepage } from '@/lib/homepage';

// Cache the homepage and refresh it every 5 minutes (ISR) rather than
// re-querying the database on every request. This makes the page fast and, on
// a free-tier host, resilient: a brief database hiccup serves the last good
// render instead of a 500. Seeded destination content changes rarely, so a
// few minutes of staleness is fine; admin edits appear within the window.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'eZAY Travels — checked across three sources, fee on the line',
  description:
    'London flight agency for families, groups and independent travellers flying to Africa, the Gulf, Turkey and the Med. Honest prices, our fee printed on the line, a reply within the hour.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const { scenes, bands, offers } = await loadHomepage();
  const flightsBookable = canSellFlights();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'eZAY Travels and Tours Ltd',
    legalName: company.legalName,
    description:
      'London flight agency for families, groups and independent travellers flying to Africa, the Gulf, Turkey and the Med. Honest prices with our fee shown on the line.',
    url: config.siteUrl,
    areaServed: 'GB',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '181 Barcombe Avenue',
      addressLocality: 'London',
      postalCode: 'SW2 3BH',
      addressCountry: 'GB',
    },
    telephone: config.contact.phone,
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

        <CityBreaks whatsappNumber={config.contact.whatsapp} />

        <DestinationPicker bands={bands} />

        <DestinationBands bands={bands} />
      </FareSelectionProvider>

      <EnquiryPanel whatsappNumber={config.contact.whatsapp} phone={config.contact.phone} />

      <CredentialsSection />

      <SiteFooter />

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
