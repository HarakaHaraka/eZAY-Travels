import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { ResumePayment } from '@/components/fares/ResumePayment';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { verifyPayToken } from '@/lib/payLink';
import { paymentProvider } from '@/lib/payments';

/**
 * Finish a booking on another device.
 *
 * Opened from the QR code on the desktop payment step, so a traveller can pay
 * with Apple Pay or Google Pay on their phone instead of typing a card into a
 * laptop. Same order, same authorisation, same book-then-capture path.
 *
 * The link is signed (see lib/payLink). An unsigned or wrong token is a 404,
 * not an error page, so references cannot be probed.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Finish your booking',
  robots: { index: false, follow: false },
};

export default async function ResumePaymentPage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams: { t?: string };
}) {
  const reference = decodeURIComponent(params.reference);
  if (!verifyPayToken(reference, searchParams.t)) notFound();

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { payments: true },
  });
  if (order === null) notFound();

  if (order.supplierRef) {
    return (
      <>
        <SiteHeader whatsappNumber={config.contact.whatsapp} />
        <main className="legal wrap">
          <h1>Already booked</h1>
          <p>
            Booking <strong>{reference}</strong> is confirmed and paid. Your confirmation is in
            your inbox. Nothing further to do.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const paymentRef =
    order.payments.find((p: { stripePaymentIntent: string | null }) => p.stripePaymentIntent)
      ?.stripePaymentIntent ?? null;
  const auth = paymentRef ? await paymentProvider().resumeAuthorization(paymentRef) : null;

  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />
      <main className="legal wrap">
        <h1>Finish your booking</h1>
        {auth === null ? (
          <p>
            This payment link has expired. Nothing has been charged. Search again, or WhatsApp us
            with reference <strong>{reference}</strong> and we will set it up for you.
          </p>
        ) : (
          <>
            <p className="legal-lead">
              Booking <strong>{reference}</strong>. Pay with Apple Pay, Google Pay or a card — the
              seat is booked the moment the payment goes through.
            </p>
            <ResumePayment
              auth={{
                reference,
                offerId: order.supplierRef ?? '',
                clientSecret: auth.clientSecret,
                publishableKey: auth.publishableKey,
              }}
              amountMinor={order.totalMinor}
              currency={order.currency}
            />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
