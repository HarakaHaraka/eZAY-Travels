import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { company, config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About eZAY Travels',
  description:
    'A London flight agency run by one named person. Somali, Swahili, Arabic and Italian spoken. Honest total prices, pay in a tap, a reply within the hour.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <main className="legal wrap">
        <h1>About eZAY</h1>
        <p className="legal-lead">
          eZAY Travels is a London flight agency run by one named person. You get my name, my
          number and a straight answer, which is more than you get from a search engine.
        </p>

        <section>
          <h2>Who you are dealing with</h2>
          <p>
            I&rsquo;m Zay (Zainab Ahmed Husein), the director and the person who answers the
            phone. I work in the NHS part of the week and have spent years booking travel for
            family, friends and community groups, including Hajj and Umrah groups and the long
            runs home to East Africa. eZAY is that service, done properly, as a registered company
            with insurance behind it.
          </p>
          <p>
            I speak English, Somali, Swahili, Arabic and Italian. If it is easier to sort your trip
            in one of those, say so.
          </p>
        </section>

        <section>
          <h2>What we do</h2>
          <ul>
            <li>
              <strong>Flights.</strong> Any route, any airline. Short-haul on easyJet and British
              Airways; long-haul to Nairobi, Mogadishu, Addis, Dar, Cairo, Istanbul, Dubai, Jeddah
              and the rest, on Turkish, Qatar, Emirates, Ethiopian, EgyptAir, Kenya Airways and
              more.
            </li>
            <li>
              <strong>Groups.</strong> Families, weddings, Umrah groups, football tours. One
              booking, one fee, everyone sitting together.
            </li>
            <li>
              <strong>The awkward bits.</strong> Name corrections, date changes, airline
              cancellations and refunds. We chase the airline so you don&rsquo;t have to.
            </li>
          </ul>
          <p>
            We sell flights only. We don&rsquo;t take payment for hotels, transfers or packages. If
            you need those, we&rsquo;ll point you to somewhere good and you book it directly.
          </p>
        </section>

        <section>
          <h2>How we price</h2>
          <p>
            We check your route across the live airline feed and our trade fares, then show you one
            total price with our service fee already inside it. How the fee is worked out is
            published in full on <Link href="/fees">our fees page</Link>. If you can show us the
            same flight cheaper elsewhere, we&rsquo;ll tell you honestly whether we can match it.
          </p>
        </section>

        <section>
          <h2>Three promises</h2>
          <ul>
            <li>A written quote within four working hours, usually within the hour on WhatsApp.</li>
            <li>No hidden extras. Bags, seats and card fees are shown before you pay, not after.</li>
            <li>A person who answers, on WhatsApp and email, 8am to 10pm, seven days a week.</li>
          </ul>
        </section>

        <section>
          <h2>The company</h2>
          <p>
            {company.legalName}, company number {company.number}, registered in{' '}
            {company.registeredIn}. Registered office {company.address}. {company.insurance}
          </p>
          <p>
            Full details, policies and how to complain are on the{' '}
            <Link href="/terms">company information page</Link>.
          </p>
        </section>

        <p style={{ marginTop: 24 }}>
          <Link href="/#enquiry">Send us your dates →</Link>
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
