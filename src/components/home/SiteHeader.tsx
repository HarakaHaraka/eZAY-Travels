import Link from 'next/link';

export function SiteHeader({ whatsappNumber }: { whatsappNumber: string }) {
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
        <Link href="/#destinations">Destinations</Link>
        <Link href="/#pricing">How we price</Link>
        <Link href="/#enquiry">Enquire</Link>
      </nav>
      <a
        className="btn btn-secondary"
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi eZAY — ')}`}
        target="_blank"
        rel="noopener"
      >
        WhatsApp us
      </a>
    </header>
  );
}
