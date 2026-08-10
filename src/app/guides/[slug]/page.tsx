import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/home/SiteHeader';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { renderGuideBody } from '@/lib/renderMarkdown';

export const dynamic = 'force-dynamic';

async function loadGuide(slug: string) {
  return prisma.destinationGuide.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const guide = await loadGuide(params.slug);
  if (guide === null) return { title: 'Guide not found' };

  return {
    title: guide.title,
    description: guide.heroSub ?? guide.bandBody ?? undefined,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: 'article',
      title: guide.title,
      description: guide.heroSub ?? undefined,
      url: `${config.siteUrl}/guides/${guide.slug}`,
      images: [{ url: guide.heroImage }],
      publishedTime: guide.createdAt.toISOString(),
      modifiedTime: guide.updatedAt.toISOString(),
    },
  };
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const guide = await loadGuide(params.slug);
  if (guide === null) notFound();

  const budgetBands = (guide.budgetBands as Record<string, string> | null) ?? {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.heroSub ?? guide.bandBody ?? '',
    image: `${config.siteUrl}${guide.heroImage}`,
    datePublished: guide.createdAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: 'eZAY Travels and Tours Ltd' },
    publisher: { '@type': 'Organization', name: 'eZAY Travels and Tours Ltd' },
    mainEntityOfPage: `${config.siteUrl}/guides/${guide.slug}`,
    about: `${guide.city}, ${guide.country}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <article className="wrap" style={{ padding: '32px clamp(16px, 2.4vw, 40px) 0', maxWidth: 900 }}>
        <Link href="/guides" style={{ fontSize: 14 }}>
          ← All guides
        </Link>

        <div
          style={{
            position: 'relative',
            marginTop: 16,
            borderRadius: 34,
            overflow: 'hidden',
            minHeight: 260,
            background: 'var(--color-night)',
          }}
        >
          <Image
            src={guide.heroImage}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>
        {guide.imageCredit && (
          <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 6 }}>
            Photo: {guide.imageCredit}
            {guide.imageLicence ? ` · ${guide.imageLicence}` : ''}
          </p>
        )}

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-700)',
          }}
        >
          {guide.city}, {guide.country}
        </p>
        <h1 style={{ fontSize: 'clamp(30px, 4vw, 46px)' }}>{guide.title}</h1>
        {guide.heroSub && (
          <p style={{ fontSize: 17, color: 'var(--color-neutral-800)', maxWidth: '60ch' }}>
            {guide.heroSub}
          </p>
        )}

        <dl
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            padding: 22,
            borderRadius: 26,
            background: 'var(--color-surface)',
            marginTop: 24,
          }}
        >
          <div>
            <dt style={{ fontSize: 12, fontWeight: 700 }}>Best booking window</dt>
            <dd style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-neutral-800)' }}>
              {guide.bookingWindow ?? 'Ask us — it moves with the season.'}
            </dd>
          </div>
          <div>
            <dt style={{ fontSize: 12, fontWeight: 700 }}>Visa</dt>
            <dd style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-neutral-800)' }}>
              {guide.visaNotes ?? 'Check current requirements before you book.'}
            </dd>
          </div>
          {Object.entries(budgetBands).map(([label, value]) => (
            <div key={label}>
              <dt style={{ fontSize: 12, fontWeight: 700 }}>{label}</dt>
              <dd style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-neutral-800)' }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div
          style={{ marginTop: 28, fontSize: 15.5, lineHeight: 1.65 }}
          dangerouslySetInnerHTML={{ __html: renderGuideBody(guide.bodyMdx) }}
        />
      </article>

      {/* Every guide ends with an enquiry CTA. */}
      <section className="enq wrap" style={{ marginTop: 48 }}>
        <div>
          <h2>Want us to price {guide.city} properly?</h2>
          <p className="lead">
            Tell us your dates and we&rsquo;ll check all three sources, then come back with the real
            number — and say plainly if your timing is wrong.
          </p>
        </div>
        <div>
          <Link className="btn btn-primary btn-block no-underline" href={`/enquiry?destination=${encodeURIComponent(guide.city)}`}>
            Get a quote for {guide.city}
          </Link>
          <p style={{ fontSize: 13, color: 'var(--color-neutral-400)', marginTop: 12 }}>
            A person replies within four working hours.
          </p>
        </div>
      </section>

      <footer>
        Last updated {guide.updatedAt.toLocaleDateString('en-GB')} · eZAY Travels and Tours Ltd
      </footer>

      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        phone={config.contact.phone}
        email={config.contact.email}
      />
    </>
  );
}
