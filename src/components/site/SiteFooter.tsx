import Link from 'next/link';
import { company } from '@/lib/config';
import { CookieBanner } from './CookieBanner';

/**
 * The one footer, used on every public page.
 *
 * Companies Act 2006 s.82 and the Company, LLP and Business (Names and Trading
 * Disclosures) Regulations 2015 require the registered name, company number,
 * place of registration and registered office on the website. They are read
 * from `company` in config so they are identical everywhere and never blank.
 */
export function SiteFooter() {
  return (
    <>
      <footer className="site-footer">
        <div className="site-footer-grid">
          <div>
            <strong>{company.legalName}</strong>
            <br />
            Trading as {company.tradingName} · Company no. {company.number} · Registered in{' '}
            {company.registeredIn}
            <br />
            Registered office: {company.address}
            <br />
            Director: {company.director}
          </div>
          <div>
            <a href={`mailto:${company.email}`}>{company.email}</a>
            <br />
            <a
              href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent('Hi eZAY — ')}`}
              target="_blank"
              rel="noopener"
            >
              WhatsApp us
            </a>
            <br />
            Replies 8am–10pm, seven days
          </div>
          <div>
            {company.insurance}
            {company.icoReference ? (
              <>
                <br />
                ICO data-protection registration: {company.icoReference}
              </>
            ) : null}
            <br />
            We act as agent for the airline named on your ticket. Flights only; no packages. We
            recommend travel insurance for every trip.
          </div>
        </div>
        <nav className="site-footer-links" aria-label="Legal and information">
          <Link href="/about">About</Link>
          <Link href="/fees">Our fees</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/guides">Destination guides</Link>
          <Link href="/terms">Company information</Link>
          <a href="/terms/booking-conditions.html">Booking conditions</a>
          <a href="/terms/refunds-and-cancellations.html">Refunds &amp; cancellations</a>
          <a href="/terms/privacy-notice.html">Privacy</a>
          <Link href="/cookies">Cookies</Link>
          <a href="/terms/complaints.html">Complaints</a>
        </nav>
        <p className="site-footer-fine">
          Fares shown on this site are examples priced on the date stated; your quote is priced to
          your dates and confirmed in writing before you pay.
        </p>
      </footer>
      <CookieBanner />
    </>
  );
}
