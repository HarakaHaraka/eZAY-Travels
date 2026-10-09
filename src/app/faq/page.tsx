import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { WhatsAppBubble } from '@/components/home/WhatsAppBubble';
import { company, config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Questions answered',
  description:
    'Visas, baggage, name changes, what happens if the airline cancels, travel insurance, paying, refunds and complaints. Straight answers from eZAY Travels.',
  alternates: { canonical: '/faq' },
};

interface Faq {
  q: string;
  a: React.ReactNode;
}

const GROUPS: Array<{ title: string; items: Faq[] }> = [
  {
    title: 'Booking and paying',
    items: [
      {
        q: 'How do I get a quote?',
        a: (
          <>
            Send your route, dates and the number of passengers by WhatsApp, the enquiry form or
            email. You get a written quote inside four working hours, usually within the hour on
            WhatsApp. The quote shows the fare, our fee and the total.
          </>
        ),
      },
      {
        q: 'How do I pay?',
        a: (
          <>
            By card through Stripe&rsquo;s secure checkout page, or by bank transfer for repeat
            customers and groups. We never see or store your card number. Your ticket is issued
            the moment the payment clears and your e-ticket and confirmation arrive by email.
          </>
        ),
      },
      {
        q: 'What does eZAY charge?',
        a: (
          <>
            A fixed service fee per booking, from £12, shown as its own line. The full list is on{' '}
            <Link href="/fees">our fees page</Link>. The airline fare is passed through at cost.
          </>
        ),
      },
      {
        q: 'Is the price I see on the site the final price?',
        a: (
          <>
            Fares shown on the site are examples priced on the date stated. Your quote is priced to
            your dates and confirmed in writing, including bags and seats, before you pay.
          </>
        ),
      },
      {
        q: 'Can you book Ryanair?',
        a: (
          <>
            Yes. Ryanair only sells through its own website, so we book it in your own Ryanair
            account with you on the phone and charge our service fee separately. That keeps your
            booking in your name and avoids Ryanair&rsquo;s extra identity checks.
          </>
        ),
      },
    ],
  },
  {
    title: 'Passports, visas and names',
    items: [
      {
        q: 'What name goes on the ticket?',
        a: (
          <>
            Exactly the name printed in the passport you will travel on, in the same order. Airlines
            refuse boarding for a mismatch, and name corrections cost money after the ticket is
            issued. Send us a photo of the passport page and we copy it letter for letter.
          </>
        ),
      },
      {
        q: 'Do I need a visa?',
        a: (
          <>
            It depends on your passport and the country. We tell you what we know for your route
            when we quote, and we point you to the official source: the UK Foreign Office travel
            advice at gov.uk/foreign-travel-advice and the destination&rsquo;s own e-visa site.
            Getting the visa is your responsibility; we will not issue a ticket for a route where
            we know you cannot enter.
          </>
        ),
      },
      {
        q: 'How much passport validity do I need?',
        a: (
          <>
            Most countries in Africa, the Gulf and Asia want at least six months left on the day you
            arrive, and at least one blank page. Check yours before you ask us to book.
          </>
        ),
      },
      {
        q: 'I booked a one-way ticket. Is that a problem?',
        a: (
          <>
            Sometimes. Some countries, and some airlines at check-in, ask for proof you will leave
            again. If you are flying one-way, tell us why and we will say whether you need an onward
            ticket or a visa that covers it.
          </>
        ),
      },
    ],
  },
  {
    title: 'Baggage and seats',
    items: [
      {
        q: 'Is a bag included?',
        a: (
          <>
            On low-cost airlines such as easyJet and Ryanair, no: the fare is a small cabin bag only
            and we add checked bags at the airline&rsquo;s price plus £5 handling. On full-service
            airlines such as Turkish, Qatar, Emirates, Ethiopian and British Airways long-haul, a
            23kg bag is usually included. Your quote says which.
          </>
        ),
      },
      {
        q: 'Can we sit together?',
        a: (
          <>
            Usually, for a seat fee set by the airline. Families with children under 12 are often
            seated together free by the airline, but not always. Ask when you book and we will add
            seats or tell you the airline&rsquo;s rule.
          </>
        ),
      },
      {
        q: 'Can I take extra luggage for family back home?',
        a: (
          <>
            Yes, extra bags are usually cheaper when bought with the ticket than at the airport. Tell
            us how many and we price them in.
          </>
        ),
      },
    ],
  },
  {
    title: 'Changes, cancellations and refunds',
    items: [
      {
        q: 'Can I change my dates after booking?',
        a: (
          <>
            That depends on the fare rules, which we show you before you pay. Most low-cost fares
            allow changes for a fee plus any fare difference; the cheapest long-haul fares often
            don&rsquo;t. We handle the change with the airline and charge £15 handling on top of the
            airline&rsquo;s own charge.
          </>
        ),
      },
      {
        q: 'What if I cancel?',
        a: (
          <>
            Airline rules apply, and many cheap fares are non-refundable except for the taxes. Our
            service fee is not refundable once the ticket is issued. We always tell you the cancel
            terms of the specific fare before you commit. See{' '}
            <a href="/terms/refunds-and-cancellations.html">refunds and cancellations</a>.
          </>
        ),
      },
      {
        q: 'What if the airline cancels or changes my flight?',
        a: (
          <>
            You are entitled to a refund or a re-route under the airline&rsquo;s rules and, for
            flights departing the UK or EU, under UK261/EU261. We chase it for you at no charge and
            pass the refund straight back to the card or account you paid from.
          </>
        ),
      },
      {
        q: 'Is my booking ATOL protected?',
        a: (
          <>
            No. We sell flight-only tickets as agent for the airline and the ticket is issued
            instantly, so it sits outside the ATOL scheme. If the airline failed, your protection
            would come from your card provider (section 75 or chargeback) and your travel
            insurance. That is why we recommend insurance for every trip.
          </>
        ),
      },
    ],
  },
  {
    title: 'Insurance and safety',
    items: [
      {
        q: 'Do I need travel insurance?',
        a: (
          <>
            Yes, buy it on the day you book, not the day you fly. It covers medical costs abroad,
            cancellation for illness, lost bags and airline failure. We do not sell insurance; use a
            comparison site and read the policy for your destination. For Hajj and Umrah, choose a
            policy that names Saudi Arabia.
          </>
        ),
      },
      {
        q: 'Will you book a route the Foreign Office advises against?',
        a: (
          <>
            Not without talking to you first. Travel insurance is usually invalid in those areas, so
            we tell you what the advice says and what it means for you before any ticket is issued.
          </>
        ),
      },
    ],
  },
  {
    title: 'About eZAY',
    items: [
      {
        q: 'Who am I dealing with?',
        a: (
          <>
            {company.legalName}, company number {company.number}, registered in{' '}
            {company.registeredIn}, run by its director Zay (Zainab Ahmed Husein). Registered
            office {company.address}. {company.insurance}
          </>
        ),
      },
      {
        q: 'How do I complain?',
        a: (
          <>
            Email {company.email} with your booking reference and what happened. We acknowledge
            within two working days and give a full written reply within 28 days. The full procedure
            is at <a href="/terms/complaints.html">complaints and disputes</a>.
          </>
        ),
      },
      {
        q: 'What languages do you speak?',
        a: <>English, Somali, Swahili, Arabic and Italian.</>,
      },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GROUPS.flatMap((g) =>
      g.items.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: typeof f.a === 'string' ? f.a : f.q },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <main className="legal wrap">
        <h1>Questions answered</h1>
        <p className="legal-lead">
          The things people ask us on WhatsApp, written down. If yours isn&rsquo;t here, ask: the
          button is at the bottom right.
        </p>

        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            {group.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        ))}

        <p style={{ marginTop: 24 }}>
          <Link href="/#enquiry">Send us your dates →</Link> · <Link href="/fees">Our fees</Link>
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
