import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Booking confirmed', robots: { index: false, follow: false } };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const reference = searchParams.ref ?? '';
  const order = reference
    ? await prisma.order.findUnique({
        where: { reference },
        include: { items: true, documents: true, customer: true },
      })
    : null;

  const Header = <SiteHeader whatsappNumber={config.contact.whatsapp} />;

  if (order === null) {
    return (
      <>
        {Header}
        <div className="wrap" style={{ maxWidth: 640, padding: '64px 20px' }}>
          <h1>We can&rsquo;t find that booking</h1>
          <p className="text-muted">Check the reference, or get in touch and we&rsquo;ll look it up.</p>
        </div>
      </>
    );
  }

  // Payment succeeded but the document did not go out. Do not tell the
  // customer they are confirmed — they are not, and a person is on it.
  if (order.status === 'requires_attention') {
    return (
      <>
        {Header}
        <div className="wrap" style={{ maxWidth: 640, padding: '64px 20px' }}>
          <h1>We&rsquo;re finishing your booking by hand</h1>
          <p style={{ color: 'var(--color-neutral-800)' }}>
            Your payment went through and your reference is <strong>{order.reference}</strong>.
            Something went wrong issuing your confirmation automatically, so a person is completing
            it now. You&rsquo;ll hear from us shortly — nothing for you to do.
          </p>
        </div>
      </>
    );
  }

  if (order.status === 'pending') {
    return (
      <>
        {Header}
        <div className="wrap" style={{ maxWidth: 640, padding: '64px 20px' }}>
          <h1>Waiting on your payment</h1>
          <p style={{ color: 'var(--color-neutral-800)' }}>
            We haven&rsquo;t had confirmation from the payment provider yet for{' '}
            <strong>{order.reference}</strong>. This page will be right once it lands — refresh in a
            moment.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {Header}
      <div className="wrap" style={{ maxWidth: 640, padding: '64px 20px' }}>
        <span className="tag tag-accent-2" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Confirmed
        </span>
        <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginTop: 12 }}>You&rsquo;re booked.</h1>
        <p style={{ color: 'var(--color-neutral-800)' }}>
          Reference <strong>{order.reference}</strong>. Your confirmation is on its way to{' '}
          <strong>{order.customer.email}</strong> with the full document attached.
        </p>

        <div className="card elev-sm" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 18 }}>What you paid for</h2>
          <div style={{ display: 'grid', gap: 8, fontSize: 14, marginTop: 6 }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="text-muted">{item.description}</span>
                <span>{formatMoney(item.priceMinor * item.qty, order.currency)}</span>
              </div>
            ))}
          </div>
          <div className="hr" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <strong>Total paid</strong>
            <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>
              {formatMoney(order.totalMinor, order.currency)}
            </strong>
          </div>
        </div>

        {order.documents[0]?.documentUrl && (
          <a
            href={`${order.documents[0].documentUrl}?email=${encodeURIComponent(order.customer.email)}`}
            className="btn btn-secondary no-underline"
            style={{ marginTop: 16 }}
          >
            Download your confirmation
          </a>
        )}

        <p style={{ marginTop: 20 }}>
          <Link href="/">← Back to eZAY</Link>
        </p>
      </div>
    </>
  );
}
