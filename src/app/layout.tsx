import type { Metadata } from 'next';
import { Caprasimo, Figtree } from 'next/font/google';
import { config } from '@/lib/config';
import { AffiliateDrive } from '@/components/site/AffiliateDrive';
import './organic.css';
import './home.css';
import './globals.css';

/**
 * The approved design's two families, loaded through next/font so they are
 * self-hosted, preloaded and not render-blocking. organic.css reads them via
 * --font-caprasimo / --font-figtree.
 */
const caprasimo = Caprasimo({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caprasimo',
});

const figtree = Figtree({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: 'eZAY Travels — flights to Africa, the Gulf, Türkiye and the Med, booked in a tap',
    template: '%s · eZAY Travels',
  },
  description:
    'London flight agency for families, groups and independent travellers. Honest total prices, Apple Pay and Google Pay, a real person on WhatsApp. Flights to Africa, the Gulf, Türkiye and the Med.',
  openGraph: {
    type: 'website',
    siteName: 'eZAY Travels and Tours',
    locale: 'en_GB',
    url: config.siteUrl,
    title: 'eZAY Travels — flights to Africa, the Gulf, Türkiye and the Med, booked in a tap',
    description:
      'London flight agency for families, groups and independent travellers. Honest total prices, Apple Pay and Google Pay, a real person on WhatsApp. Flights to Africa, the Gulf, Türkiye and the Med.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eZAY Travels — flights to Africa, the Gulf, Türkiye and the Med, booked in a tap',
    description: 'Honest total prices, pay in a tap, a real person on WhatsApp.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${caprasimo.variable} ${figtree.variable}`}>
      <body>
        {children}
        <AffiliateDrive accountId={config.affiliate.travelpayoutsId} />
      </body>
    </html>
  );
}
