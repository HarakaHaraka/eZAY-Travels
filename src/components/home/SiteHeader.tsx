import Link from 'next/link';

/**
 * Same header on every screen size. The nav stays visible on a phone (it
 * scrolls sideways if it must) instead of disappearing, and the action button
 * is the phone line, not WhatsApp — the floating bubble already covers chat.
 * The number itself is never printed; the link carries it.
 */
export function SiteHeader({ whatsappNumber }: { whatsappNumber: string }) {
  // The business line IS the WhatsApp line. Built from that value only, so the
  // personal-mobile config fallback can never reach this link (see
  // tests/noPhoneOnPublicSite.test.ts).
  const tel = `tel:+${whatsappNumber.replace(/\D/g, '')}`;
  return (
    <header className="hdr">
      <Link className="lock" href="/#top">
        <span className="mark">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f1f6fa"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 15c5.5 0 9-3 12-9" />
            <path d="M14.5 6H21v6.5" />
          </svg>
        </span>
        <span className="word">eZAY</span>
      </Link>
      <nav>
        <Link href="/#top">Destinations</Link>
        <Link href="/fees">Our fees</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/#enquiry">Enquire</Link>
      </nav>
      <a className="btn btn-secondary" href={tel}>
        Call us
      </a>
    </header>
  );
}
