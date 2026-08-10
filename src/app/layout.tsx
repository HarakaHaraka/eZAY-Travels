import type { Metadata } from 'next';
import { Caprasimo, Figtree } from 'next/font/google';
import { config } from '@/lib/config';
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
    default: 'eZAY Travels — checked across three sources, fee on the line',
    template: '%s · eZAY Travels',
  },
  description:
    'UK travel agency for festival and long-haul independent travellers. Every fare checked across three sources, our fee printed on the line. Quote back within four working hours.',
  openGraph: {
    type: 'website',
    siteName: 'eZAY Travels and Tours',
    locale: 'en_GB',
    url: config.siteUrl,
    title: 'eZAY Travels — checked across three sources, fee on the line',
    description:
      'Every fare checked across three sources, our fee printed on the line. Quote back within four working hours.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eZAY Travels — checked across three sources, fee on the line',
    description: 'Every fare checked across three sources, our fee printed on the line.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${caprasimo.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
