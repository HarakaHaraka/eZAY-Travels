'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scene } from '@/lib/homepage';
import { formatMoneyWhole } from '@/lib/money';
import { useFareSelection } from './FareSelection';

/** Today + n days as an ISO yyyy-mm-dd string (matches the /fares defaults). */
function isoPlusDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The rotating hero and the sticky fare bar.
 *
 * Motion rules from the design, all honoured:
 *  - 1.4s crossfade between layers (CSS: .hero .layer transition)
 *  - Ken Burns drift on the image (CSS: @keyframes ezKen)
 *  - the fare bar's glow pulse (CSS: @keyframes ezGlow)
 *  - prefers-reduced-motion kills all three in CSS, and stops the rotation
 *    timer here — CSS alone cannot stop a setInterval.
 *
 * The rotation interval is a single constant, supplied from config
 * (HERO_ROTATION_MS, default 5000).
 */
export function HeroAndFareBar({
  scenes,
  rotationMs,
  flightsBookable,
}: {
  scenes: Scene[];
  rotationMs: number;
  flightsBookable: boolean;
}) {
  const router = useRouter();
  const { selectedOffer, selectOffer, trip, setTrip, pax, setPax } = useFareSelection();

  const [sceneIndex, setSceneIndex] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [searching, setSearching] = useState(false);
  const [origin, setOrigin] = useState('London LON');
  // The To field is editable and backed by its own state. It is prefilled from
  // the selected scene/offer (effect below), but whatever the user types wins.
  const [destination, setDestination] = useState(selectedOffer?.city ?? '');
  const [departDate, setDepartDate] = useState(() => isoPlusDays(45));
  const [returnDate, setReturnDate] = useState(() => isoPlusDays(52));

  const barSentinel = useRef<HTMLDivElement | null>(null);
  const toInput = useRef<HTMLInputElement | null>(null);
  const paused = useRef(false);

  const scene = scenes[sceneIndex];
  const todayIso = isoPlusDays(0);

  useEffect(() => {
    if (scenes.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (paused.current) return;
      setSceneIndex((current) => (current + 1) % scenes.length);
    }, rotationMs);
    return () => window.clearInterval(timer);
  }, [scenes.length, rotationMs]);

  // Changing scene selects that destination's headline offer, driving the bar.
  const sceneOfferId = scene?.offerId ?? null;
  useEffect(() => {
    if (sceneOfferId) selectOffer(sceneOfferId);
  }, [sceneOfferId, selectOffer]);

  // Selecting a scene/offer prefills the To field; typing then overrides it
  // (and pauses rotation, so a passing scene can't overwrite what was typed).
  const selectedCity = selectedOffer?.city;
  useEffect(() => {
    if (selectedCity) setDestination(selectedCity);
  }, [selectedCity]);

  // Soft backdrop once the bar detaches from the hero.
  useEffect(() => {
    const node = barSentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio === 0),
      { threshold: [0], rootMargin: '-64px 0px 0px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const pickScene = useCallback((index: number) => {
    // Once someone chooses for themselves, stop rotating under them.
    paused.current = true;
    setSceneIndex(index);
  }, []);

  const totalMinor = (selectedOffer?.totalMinor ?? 0) * pax;
  // The headline total belongs to the selected offer. Once the typed
  // destination diverges from it, the price no longer describes the search —
  // so we stop showing a number that would be wrong.
  const priceMatchesTyped =
    !!selectedOffer &&
    destination.trim().toLowerCase() === selectedOffer.city.trim().toLowerCase();

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    const dest = destination.trim();
    if (dest === '') {
      toInput.current?.focus();
      return;
    }

    setSearching(true);

    const params = new URLSearchParams({
      origin,
      destination: dest,
      departureDate: departDate,
      pax: String(pax),
      ...(trip === 'return' ? { returnDate } : { trip: 'oneway' }),
    });

    // Always show the fares — that transparency is the whole positioning. The
    // results page itself handles the not-bookable case: it shows real prices
    // and routes each one to the enquiry form rather than a dead checkout.
    void flightsBookable;
    router.push(`/fares?${params}`);
  }

  return (
    <>
      <section className="hero" id="top">
        <div id="layers" aria-hidden="true">
          {scenes.map((s, index) => (
            <div key={s.slug} className={`layer${index === sceneIndex ? ' on' : ''}`}>
              <Image
                src={s.image}
                alt=""
                fill
                sizes="100vw"
                // The first hero image is the LCP element.
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                quality={82}
              />
            </div>
          ))}
        </div>
        <div className="scrim" aria-hidden="true" />
        <div className="inner wrap" style={{ width: '100%' }}>
          <span className="tag kick">{scene?.kicker}</span>
          <h1>{scene?.headline}</h1>
          <p className="sub">{scene?.sub}</p>
          <div className="chips" role="group" aria-label="Featured destinations">
            {scenes.map((s, index) => (
              <button
                key={s.slug}
                className="chip"
                type="button"
                aria-pressed={index === sceneIndex}
                onClick={() => pickScene(index)}
              >
                {s.chip}
              </button>
            ))}
          </div>
        </div>
        <span className="credit">{scene?.credit ?? ''}</span>
      </section>

      <div ref={barSentinel} style={{ position: 'relative', top: 0, height: 1, width: 1 }} />

      <div className={`barwrap${stuck ? ' stuck' : ''}`} id="farebar">
        <form className="bar" onSubmit={handleSearch}>
          <div className="trip" role="group" aria-label="Trip type">
            <button type="button" aria-pressed={trip === 'return'} onClick={() => setTrip('return')}>
              Return
            </button>
            <button type="button" aria-pressed={trip === 'oneway'} onClick={() => setTrip('oneway')}>
              One way
            </button>
          </div>

          <div className="well f1">
            <label htmlFor="from">From</label>
            <input id="from" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </div>
          <div className="well f1">
            <label htmlFor="to">To</label>
            <input
              id="to"
              ref={toInput}
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                // Keep a rotating scene from overwriting what they type.
                paused.current = true;
              }}
            />
          </div>
          <div className="well f2">
            <label htmlFor="depart">Dates</label>
            <div className="dates">
              <input
                id="depart"
                type="date"
                value={departDate}
                min={todayIso}
                onChange={(e) => {
                  const value = e.target.value;
                  setDepartDate(value);
                  // Return can never fall before departure.
                  if (returnDate < value) setReturnDate(value);
                }}
              />
              {trip === 'return' && (
                <input
                  id="return"
                  type="date"
                  aria-label="Return date"
                  value={returnDate}
                  min={departDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="stepper">
            <button type="button" aria-label="Fewer travellers" onClick={() => setPax((p) => p - 1)}>
              −
            </button>
            <span className="n" aria-live="polite">
              {pax === 1 ? '1 adult' : `${pax} adults`}
            </span>
            <button type="button" aria-label="More travellers" onClick={() => setPax((p) => p + 1)}>
              +
            </button>
          </div>

          <div className="total">
            <span>{priceMatchesTyped ? 'Best of 3 sources' : 'Priced on search'}</span>
            <strong>{priceMatchesTyped ? formatMoneyWhole(totalMinor) : '—'}</strong>
          </div>

          <button className="btn go" type="submit" disabled={searching}>
            {searching ? 'Checking 3 sources…' : 'Search fares'}
          </button>
        </form>
      </div>
    </>
  );
}
