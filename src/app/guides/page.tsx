import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/home/SiteHeader';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Destination guides',
  description:
    'What we would tell you on the phone, written down: the real booking window, realistic budgets, visa notes and when to actually go.',
  alternates: { canonical: '/guides' },
};

export default async function GuidesIndex() {
  const guides = await prisma.destinationGuide.findMany({
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <div className="wrap" style={{ padding: '48px clamp(16px, 2.4vw, 40px) 0' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>Destination guides</h1>
        <p style={{ maxWidth: '58ch', fontSize: 17, color: 'var(--color-neutral-800)' }}>
          What we&rsquo;d tell you on the phone, written down. Real booking windows, realistic
          numbers, and the specific thing that catches people out on each route.
        </p>

        <div
          style={{
            display: 'grid',
            gap: 18,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            marginTop: 32,
            paddingBottom: 40,
          }}
        >
          {guides.map((guide) => (
            <article
              key={guide.id}
              style={{
                borderRadius: 26,
                overflow: 'hidden',
                background: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', height: 170 }}>
                <Image
                  src={guide.heroImage}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                  loading="lazy"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: '.09em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent-700)',
                    margin: 0,
                  }}
                >
                  {guide.city}, {guide.country}
                </p>
                <h2 style={{ fontSize: 19, margin: '6px 0 8px', lineHeight: 1.2 }}>
                  <Link href={`/guides/${guide.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {guide.title}
                  </Link>
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--color-neutral-800)', flex: 1 }}>
                  {guide.heroSub}
                </p>
                {guide.bookingWindow && (
                  <p
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-neutral-700)',
                      borderTop: '1px solid var(--color-divider)',
                      paddingTop: 10,
                      margin: '10px 0 0',
                    }}
                  >
                    <strong>Book:</strong> {guide.bookingWindow}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <footer>eZAY Travels and Tours Ltd · London</footer>

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
