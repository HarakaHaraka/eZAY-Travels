import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Our fees',
  description:
    'eZAY charges a fixed service fee per booking, shown as its own line before you pay. Here is the whole price list.',
  alternates: { canonical: '/fees' },
};

/**
 * The published fee schedule.
 *
 * This page must describe what src/lib/markup.ts ACTUALLY does, not an
 * aspirational price list: 5% of the fare on short-haul, 8% on long-haul, and
 * never less than £10 per traveller. If the markup rules change, change this
 * page in the same commit.
 */
const WORKED_EXAMPLES: Array<[trip: string, fare: string, fee: string, total: string]> = [
  ['Marrakech, 2 travellers, short-haul', '£372.54', '£40.00 (the £20 minimum, twice)', '£412.54'],
  ['Rome, 1 traveller, short-haul', '£200.00', '£20.00 (the minimum)', '£220.00'],
  ['Rome, 1 traveller, pricier fare', '£500.00', '£25.00 (5%)', '£525.00'],
  ['Nairobi, 1 traveller, long-haul', '£500.00', '£40.00 (8%)', '£540.00'],
  ['Jeddah, family of 4, long-haul', '£2,000.00', '£160.00 (8%)', '£2,160.00'],
];

/**
 * Extras. Duffel charges $2.00 per paid ancillary, so the handling charge has
 * to cover that plus the time. These are published here and nowhere else: a
 * bag upsell shouted beside a Book button is the behaviour customers hate
 * about the budget airlines, and it is exactly what we are not.
 */
const EXTRAS: Array<[extra: string, price: string, note: string]> = [
  ['Checked bag added to your booking', 'Airline price + £6', 'Nearly always cheaper than paying at the airport'],
  ['Second or oversized bag', 'Airline price + £8', 'Worth asking about for family luggage runs'],
  ['Sports or music equipment', 'Airline price + £10', 'We confirm the airline will carry it before you pay'],
  ['Seat selection, so you sit together', 'Airline price + £4', 'Families with under-12s are often seated together free'],
  ['Date change or name correction', 'Airline charge + £15', 'We deal with the airline for you'],
  ['Refund when the airline cancels', 'Free', 'We chase it and pass the money straight back'],
  ['Group booking, 4 or more on one order', '£60 flat', 'Instead of the per-traveller fee'],
];

export default function FeesPage() {
  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <main className="legal wrap">
        <h1>Our fees</h1>
        <p className="legal-lead">
          One fixed service fee per booking, printed as its own line on your quote and your
          confirmation. The airline fare is passed through at cost. Nothing is hidden in the
          ticket price.
        </p>

        <section>
          <h2>How the fee is worked out</h2>
          <p>Two numbers, and that is the whole rule:</p>
          <ul>
            <li>
              <strong>5% of the fare</strong> on short-haul trips — Europe, Türkiye, Morocco,
              Tunisia.
            </li>
            <li>
              <strong>8% of the fare</strong> on long-haul trips — Africa, the Gulf, Asia, the
              Americas.
            </li>
            <li>
              <strong>Never less than £20 per traveller</strong>, so a very cheap fare still covers
              the work.
            </li>
          </ul>
          <p>
            The fee is already inside the price you see. There is nothing added at the end, and the
            price does not change between the search results and the payment page.
          </p>
        </section>

        <section>
          <h2>What that means in practice</h2>
          <table>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Airline fare</th>
                <th>Our fee</th>
                <th>You pay</th>
              </tr>
            </thead>
            <tbody>
              {WORKED_EXAMPLES.map(([trip, fare, fee, total]) => (
                <tr key={trip}>
                  <td>{trip}</td>
                  <td>{fare}</td>
                  <td>{fee}</td>
                  <td>
                    <strong>{total}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <strong>Launch offer:</strong> no service fee at all on our first ten bookings. We ask
            for an honest Google review in return.
          </p>
        </section>

        <section>
          <h2>Extras, when you want them</h2>
          <p>
            You will not be chased for any of these. Ask, and we add them at the airline&rsquo;s own
            price plus a small handling charge for doing it and checking it is right.
          </p>
          <table>
            <thead>
              <tr>
                <th>Extra</th>
                <th>What you pay</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {EXTRAS.map(([extra, price, note]) => (
                <tr key={extra}>
                  <td>{extra}</td>
                  <td>{price}</td>
                  <td>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>Paying</h2>
          <ul>
            <li>Card, through Stripe&rsquo;s secure checkout. We never see or store card numbers.</li>
            <li>
              Bank transfer for repeat customers and groups, which saves the card fee and we pass
              that saving back.
            </li>
            <li>
              Airline tickets are issued the moment payment clears, so cancellation after that
              follows the airline&rsquo;s own rules, shown to you before you pay. Our service fee is
              not refundable once the ticket has been issued.
            </li>
          </ul>
        </section>

        <section>
          <h2>Hotel links</h2>
          <p>
            We sell flights only and take no payment for accommodation. The hotels we show are
            linked to booking sites; where we have joined that site&rsquo;s partner programme, it
            may pay eZAY a small commission on a completed stay. The price you pay is identical
            either way, and we only list places we would stay ourselves.
          </p>
        </section>

        <section>
          <h2>Not included, deliberately</h2>
          <p>
            We don&rsquo;t sell hotels, transfers, car hire or packages, and we don&rsquo;t take
            payment for them. Our flight tickets are not ATOL protected, because they are issued
            instantly and we act as agent for the airline. We recommend travel insurance for every
            trip and we say so on every confirmation.
          </p>
        </section>

        <p style={{ marginTop: 24 }}>
          <Link href="/#enquiry">Get a quote →</Link> · <Link href="/faq">Questions answered</Link>
        </p>
      </main>

      <SiteFooter />
      <WhatsAppBubble
        whatsappNumber={config.contact.whatsapp}
        email={config.contact.email}
      />
    </>
  );
}
