import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Terms, policies & company information — eZAY Travels',
  description:
    'Company information, how we source fares, provision of service, complaints procedure and policies for EZAY Travels and Tours Ltd.',
  alternates: { canonical: '/terms' },
};

/**
 * Terms, policies and company information.
 *
 * This is where the "how we source your fares" and "where we are, honestly"
 * copy now lives — as compliance/legal print rather than homepage marketing.
 * Financial-protection wording is deliberately claim-free until accreditation
 * is configured (see CLAUDE.md rule 4): we make no protection claim here.
 */
export default function TermsPage() {
  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <main className="legal wrap">
        <h1>Terms, policies &amp; company information</h1>
        <p className="legal-lead">
          The plain-English version of who we are, how we price your trip, and what to do if
          something goes wrong. Full policy documents follow as we complete our accreditation.
        </p>

        <section>
          <h2>Who we are</h2>
          <p>
            <strong>EZAY TRAVELS AND TOURS LTD</strong>, trading as <strong>Ezay Travels</strong>.
            Registered in England &amp; Wales, company number <strong>17394853</strong>, based in
            London.
          </p>
          <ul>
            <li>Contact: Zay Siyad</li>
            <li>
              Email: <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>
            </li>
            <li>Phone: {config.contact.phone}</li>
          </ul>
        </section>

        <section>
          <h2>How we source your fares</h2>
          <p>
            A fare can come from three places, and we check all of them before we send you a number.
            Then we tell you which one we used and what we made on it — because you&rsquo;ll find out
            eventually, and it&rsquo;s better coming from us.
          </p>
          <ul>
            <li>
              <strong>The live search.</strong> Real-time airline pricing, the same feed the big
              sites use. Fast, and honest on short-haul.
            </li>
            <li>
              <strong>Trade net fares.</strong> Consolidator pricing you can&rsquo;t see publicly.
              On long-haul this is usually where your saving comes from.
            </li>
            <li>
              <strong>Our ticketing partner.</strong> Ticketed and issued through an accredited
              partner. We tell you which fare we used and what our fee was.
            </li>
          </ul>
        </section>

        <section>
          <h2>Provision of service</h2>
          <p>
            We quote flights and attach the parts of the trip that belong with them — hotels,
            airport transfers, insurance and add-ons — and present a single price with our fee shown
            on the line. Prices shown on the site are examples; your quote is priced to your dates
            and confirmed in writing before you pay. A confirmation document with your booking
            reference follows every completed order.
          </p>
        </section>

        <section>
          <h2>Financial protection</h2>
          <p>
            eZAY Travels is completing its financial-protection accreditation. Until that is
            confirmed we make <strong>no</strong> protection claim, and flights are handled as a
            written enquiry rather than instant online checkout. Once accreditation is in place, the
            protection that applies to your booking — and the licence details — will be published
            here and shown on your confirmation.
          </p>
        </section>

        <section>
          <h2>Complaints</h2>
          <p>
            If something isn&rsquo;t right, tell us first and quickly — most things are fixable while
            you travel. Email{' '}
            <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a> with your booking
            reference and what happened. We aim to acknowledge within two working days and to give
            you a full written response within 28 days. If we can&rsquo;t resolve it between us,
            we&rsquo;ll point you to the relevant independent scheme once our accreditation is
            confirmed.
          </p>
        </section>

        <section>
          <h2>Policies</h2>
          <p>
            Summaries below; the full documents will be linked here as they are finalised.
          </p>
          <ul>
            <li>
              <strong>Privacy &amp; data.</strong> We use your details only to quote, book and
              support your trip, and to contact you about it. We don&rsquo;t sell your data. Card
              details are handled by our payment provider&rsquo;s hosted checkout — we never see or
              store them.
            </li>
            <li>
              <strong>Cancellations &amp; changes.</strong> Airline and supplier rules apply to each
              fare and are shown before you pay; our service fee is separate. We&rsquo;ll always
              tell you the change/cancel terms of a specific fare before you commit.
            </li>
            <li>
              <strong>Cookies.</strong> We keep these to what makes the site work and helps us
              improve it.
            </li>
          </ul>
        </section>

        <p className="legal-note">
          This page is a working summary and will be finalised with professional review before we
          sell flights to the public. Nothing here is a protection claim.
        </p>

        <p style={{ marginTop: 24 }}>
          <Link href="/#top">← Back to the homepage</Link>
        </p>
      </main>

      <footer>
        EZAY TRAVELS AND TOURS LTD (trading as Ezay Travels) · Company No. 17394853 · London
      </footer>
    </>
  );
}
