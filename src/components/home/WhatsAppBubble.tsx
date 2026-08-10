'use client';

import { useEffect, useRef, useState } from 'react';

/** Quick-reply openers, exactly as in the approved design. */
const QUICK_REPLIES: Array<[label: string, opener: string]> = [
  ['Flights', "Hi eZAY — I'd like a fare quote. Where and when: "],
  ['A whole trip, priced together', 'Hi eZAY — flight, hotel and transfer please. Details: '],
  ['A group', "Hi eZAY — I'm organising a group. Size, destination, dates: "],
  ['An existing booking', 'Hi eZAY — question about my booking. Reference: '],
  ['Something else', 'Hi eZAY — '],
];

export function WhatsAppBubble({
  whatsappNumber,
  phone,
  email,
}: {
  whatsappNumber: string;
  phone: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  // Escape closes the panel and returns focus to the button that opened it.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const wa = (text: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

  return (
    <div className="wabub">
      <div className="wapanel" id="waPanel" hidden={!open}>
        <div className="h">
          <strong>Chat to us</strong>
          <span>Usually replies within the hour</span>
        </div>
        <div className="b">
          <p>What&rsquo;s it about? Pick one and WhatsApp opens with your message ready.</p>
          <div>
            {QUICK_REPLIES.map(([label, opener]) => (
              <a
                key={label}
                className="qr"
                href={wa(opener)}
                target="_blank"
                rel="noopener"
                style={{ textDecoration: 'none' }}
              >
                {label}
              </a>
            ))}
          </div>
          <div className="waalt">
            <a href={`tel:${phone}`}>Call instead</a>
            <a href={`mailto:${email}`}>Email instead</a>
          </div>
        </div>
      </div>

      <button
        ref={fabRef}
        className="fab"
        aria-expanded={open}
        aria-controls="waPanel"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className="pl" aria-hidden="true" />
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.3-1.95 1.35-.5.05-.98.23-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.13-.18-1.11-1.48-1.11-2.82s.7-2 .95-2.27c.25-.27.54-.34.72-.34h.52c.17 0 .4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.14-.28.29-.12.56.16.27.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.22 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
        </svg>
        <span className="t">Chat to us</span>
      </button>
    </div>
  );
}
