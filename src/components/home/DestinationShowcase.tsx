'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Band } from '@/lib/homepage';
import { formatMoneyWhole } from '@/lib/money';
import { useFareSelection } from './FareSelection';

/**
 * One destination at a time, rotating every five seconds.
 *
 * This replaces the stacked destination bands, which made the landing page
 * very long and buried everything after the first destination. The same data
 * and the same markup are used; only one band is mounted at a time.
 *
 * Rotation stops the moment the visitor shows intent — hovering, focusing,
 * clicking the pause control or picking a city from the tabs — and does not
 * restart on its own, because a panel that moves while someone is reading it
 * is worse than no rotation at all. It also never starts for a visitor whose
 * system asks for reduced motion.
 *
 * The fee is deliberately not printed on the offer cards here, for the same
 * reason it is not printed on the fare results (CLAUDE.md rule 5).
 */
const ROTATE_MS = 5000;

export function DestinationShowcase({
  bands,
  linkRel = 'noopener',
  stayNote,
}: {
  bands: Band[];
  /** 'sponsored noopener' once hotel links carry an affiliate tag. */
  linkRel?: string;
  /** Replaces the default accommodation note, e.g. the affiliate disclosure. */
  stayNote?: string;
}) {
  const { selectedOfferId, selectOffer } = useFareSelection();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<number | null>(null);

  // Respect a reduced-motion preference: never auto-advance.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query?.matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || bands.length < 2) return;
    timer.current = window.setTimeout(() => setIndex((i) => (i + 1) % bands.length), ROTATE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, playing, bands.length]);

  if (bands.length === 0) return null;

  /** Any deliberate interaction stops the carousel for good. */
  function hold() {
    setPlaying(false);
  }

  function go(next: number) {
    setPlaying(false);
    setIndex((next + bands.length) % bands.length);
  }

  function chooseOffer(id: string) {
    setPlaying(false);
    selectOffer(id);
    document.getElementById('farebar')?.scrollIntoView({ block: 'nearest' });
  }

  const band = bands[index];

  return (
    <div
      className="bands wrap"
      id="destinations"
      aria-roledescription="carousel"
      aria-label="Destinations"
      onMouseEnter={hold}
      onFocusCapture={hold}
    >
      <div className="ds-bar">
        <div className="ds-tabs" role="tablist" aria-label="Choose a destination">
          <button type="button" className="ds-arrow" aria-label="Previous destination" onClick={() => go(index - 1)}>
            ‹
          </button>
          {bands.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`ds-tab${i === index ? ' on' : ''}`}
              onClick={() => go(i)}
            >
              {item.city}
            </button>
          ))}
          <button type="button" className="ds-arrow" aria-label="Next destination" onClick={() => go(index + 1)}>
            ›
          </button>
        </div>
        <button
          type="button"
          className="ds-play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Stop the slideshow' : 'Start the slideshow'}
        >
          {playing ? '❚❚ Stop' : '▶ Play'}
        </button>
      </div>

      <section className="band" id={`dest-${band.slug}`} key={band.slug} aria-live="polite">
        <div className="row">
          <div style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="panel">
              <Image
                src={band.image}
                alt={band.heading}
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
                priority={index === 0}
                quality={80}
              />
              <div className="ov" />
              <div className="txt">
                <span className={`tag ${band.tagTone}`}>{band.tag}</span>
                <h2>{band.heading}</h2>
                <p>{band.body}</p>
              </div>
            </div>

            <div className="offers">
              {band.offers.map((offer) => (
                <button
                  key={offer.id}
                  className="offer"
                  type="button"
                  aria-pressed={selectedOfferId === offer.id}
                  onClick={() => chooseOffer(offer.id)}
                >
                  <div className="top">
                    <span className="route">{offer.route}</span>
                    <span className={`tag ${offer.badgeTone}`}>{offer.badge}</span>
                  </div>
                  <div className="tot">{formatMoneyWhole(offer.totalMinor)}</div>
                  <div className="det">{offer.detail}</div>
                </button>
              ))}
            </div>
          </div>

          <aside className="side">
            <div>
              <h6>Where to stay in {band.city}</h6>
              <div className="rows">
                {band.stays.length === 0 && (
                  <p className="note" style={{ margin: 0 }}>
                    We quote accommodation by hand for {band.city} — ask us and we will price it
                    with the flight.
                  </p>
                )}
                {band.stays.map((stay) => (
                  <div className="r" key={stay.name}>
                    <Image
                      className="thumb"
                      src={stay.images[0] ?? '/images/thumb-stay-1.jpg'}
                      alt=""
                      width={76}
                      height={76}
                      loading="lazy"
                    />
                    <span className="meta">
                      {stay.bookingUrl ? (
                        <a className="nm lnk" href={stay.bookingUrl} target="_blank" rel={linkRel}>
                          {stay.name}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      ) : (
                        <span className="nm">{stay.name}</span>
                      )}
                      <span className="sb">{stay.note}</span>
                    </span>
                    <span className="pr">
                      {stay.fromMinor === null ? 'Ask us' : `from ${formatMoneyWhole(stay.fromMinor)}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="note" style={{ marginTop: 10, fontSize: 12 }}>
                {stayNote ??
                  'We do not sell accommodation and take no payment for it — these are places we rate, linked straight to the hotel. Book them yourself, and we will time the flights around them.'}
              </p>
            </div>

            {band.around.length > 0 && (
              <>
                <div className="div" />
                <div>
                  <h6>Getting there &amp; around</h6>
                  <div className="rows">
                    {band.around.map((row) => (
                      <div className="r" key={row.name}>
                        <Image className="thumb" src={row.thumb} alt="" width={76} height={76} loading="lazy" />
                        <span className="meta">
                          <span className="nm">{row.name}</span>
                          <span className="sb">{row.note}</span>
                        </span>
                        <span className="pr">{row.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {band.note && (
              <>
                <div className="div" />
                <p className="note" style={{ margin: 0 }}>
                  {band.note}
                </p>
              </>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
