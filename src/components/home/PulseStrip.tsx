'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PulseItem } from '@/lib/pulse';

/**
 * A strip of three cards that advances one card every five seconds. Each
 * card is a single click to a guide or a quote. Hovering or touching holds it.
 * Follow buttons appear only when a social URL is configured, so the site
 * never links to a channel that does not exist yet.
 */
const ROTATE_MS = 5000;

export function PulseStrip({
  items,
  social,
}: {
  items: PulseItem[];
  social: { instagram: string; tiktok: string; facebook: string };
}) {
  const [start, setStart] = useState(0);
  const [held, setHeld] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (held || items.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = window.setTimeout(() => setStart((s) => (s + 1) % items.length), ROTATE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [start, held, items.length]);

  if (items.length === 0) return null;

  const visible = [0, 1, 2].map((offset) => items[(start + offset) % items.length]);
  const follows = [
    ['Instagram', social.instagram],
    ['TikTok', social.tiktok],
    ['Facebook', social.facebook],
  ].filter(([, url]) => url);

  return (
    <section
      className="pulse wrap"
      id="pulse"
      aria-label="Right now"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onTouchStart={() => setHeld(true)}
    >
      <div className="pulse-head">
        <h3>Right now</h3>
        {follows.length > 0 && (
          <div className="pulse-follow">
            {follows.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener">
                {name}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="pulse-row">
        {visible.map((item, i) => {
          const card = (
            <>
              <span className="pulse-kind">{item.kind}</span>
              <strong>{item.title}</strong>
              <span className="pulse-cap">{item.caption}</span>
            </>
          );
          const className = `pulse-card${i === 0 ? ' is-lead' : ''}`;
          return item.href.startsWith('/') ? (
            <Link key={item.id} href={item.href} className={className} style={{ background: item.wash }}>
              {card}
            </Link>
          ) : (
            <a
              key={item.id}
              href={item.href}
              className={className}
              style={{ background: item.wash }}
              target="_blank"
              rel="noopener"
            >
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}
