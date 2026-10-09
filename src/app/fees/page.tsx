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
 * The published fee schedule. Fixed per booking, not hidden in the fare.
 * Keep this in step with the service-fee strategy workbook: the bands are
 * chosen so eZAY stays within about £20 of the airline's own price on
 * short-haul and earns its margin on long-haul, groups and changes.
 */
const FEE_BANDS: Array<[band: string, fee: string, extra: string]> = [
  ['Short-haul, fare under £120 per person (easyJet, Ryanair, Europe)', '£12', '£5'],
  ['Fare £120 to £250 per person (North Africa, Turkey, the Med)', '£20', '£8'],
  ['Fare £250 to £600 per person (Gulf, East Africa, Somalia via Istanbul or Dubai)', '£35', '£10'],
  ['Fare over £600 per person (long-haul, business class, Umrah groups)', '£50', '£15'],
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
          <h2>Service fee per booking</h2>
          <table>
            <thead>
              <tr>
                <th>Fare band (return, per person)</th>
                <th>Fee for the booking</th>
                <th>Each extra passenger</th>
              </tr>
            </thead>
            <tbody>
              {FEE_BANDS.map(([band, fee, extra]) => (
                <tr key={band}>
                  <td>{band}</td>
                  <td>{fee}</td>
                  <td>{extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Example: two of you to Marrakech on easyJet at £110 each. Fare £220, service fee £12 +
            £5 = £17, total £237. That is the number you pay, and the £17 is shown on the line.
          </p>
          <p>
            <strong>Launch offer:</strong> the service fee is £0 on our first ten bookings. We ask
            for an honest Google review in return.
          </p>
        </section>

        <section>
          <h2>Extras, when you want them</h2>
          <table>
            <thead>
              <tr>
                <th>Extra</th>
                <th>What you pay</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Checked bag added to your booking</td>
                <td>Airline price + £5 handling</td>
              </tr>
              <tr>
                <td>Seat selection (so you sit together)</td>
                <td>Airline price + £3 handling</td>
              </tr>
              <tr>
                <td>Date change or name correction after booking</td>
                <td>Airline charge + £15 handling</td>
              </tr>
              <tr>
                <td>Refund processing when the airline cancels</td>
                <td>£0 — we chase it for you</td>
              </tr>
              <tr>
                <td>Group bookings of 4 or more on one order</td>
                <td>£40 flat admin fee instead of per-passenger fees</td>
              </tr>
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
