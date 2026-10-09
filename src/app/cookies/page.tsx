import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'The cookies ezaytravels.co.uk sets, what each one does, and why there is no tracking.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <>
      <SiteHeader whatsappNumber={config.contact.whatsapp} />

      <main className="legal wrap">
        <h1>Cookies</h1>
        <p className="legal-lead">
          A cookie is a small file a website saves in your browser so it can remember something
          between pages. We set only the ones the site needs to work.
        </p>

        <section>
          <h2>What we set</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>What it does</th>
                <th>How long</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ezay-cookie-notice-v1</td>
                <td>Remembers that you have closed the cookie notice so it does not show again.</td>
                <td>Until you clear your browser</td>
              </tr>
              <tr>
                <td>Fare search session</td>
                <td>Keeps the flights you searched while you move between pages on this site.</td>
                <td>Until you close the browser</td>
              </tr>
              <tr>
                <td>Stripe checkout</td>
                <td>
                  Set by Stripe on its own payment page to run the payment securely and spot fraud.
                  Governed by Stripe&rsquo;s own cookie policy.
                </td>
                <td>Set by Stripe</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>What we do not set</h2>
          <p>
            No analytics cookies, no advertising cookies, no social-media trackers. If that ever
            changes we will ask for your permission first, on this site, before any such cookie is
            set.
          </p>
        </section>

        <section>
          <h2>Turning cookies off</h2>
          <p>
            Your browser lets you block or delete cookies in its settings. If you block the fare
            search session cookie, flight search on this site will not work, but you can still send
            us an enquiry and we will quote by email or WhatsApp.
          </p>
        </section>

        <p style={{ marginTop: 24 }}>
          <a href="/terms/privacy-notice.html">Privacy notice</a> ·{' '}
          <Link href="/terms">Company information</Link>
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
