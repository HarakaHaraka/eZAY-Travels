'use client';

import Image from 'next/image';
import type { Band } from '@/lib/homepage';
import { formatMoneyWhole } from '@/lib/money';
import { useFareSelection } from './FareSelection';

/**
 * The destination bands: photo panel, two offer cards, and a sidebar of real
 * hotel and getting-around rows.
 *
 * The "where to stay" prices come from the Hotel registry. A rate that has
 * not been verified is a placeholder, so loadHomepage() withholds its price
 * and this renders "Ask us" — the public site never shows an invented number.
 */
export function DestinationBands({ bands }: { bands: Band[] }) {
  const { selectedOfferId, selectOffer } = useFareSelection();

  function chooseOffer(id: string) {
    selectOffer(id);
    document.getElementById('farebar')?.scrollIntoView({ block: 'nearest' });
  }

  return (
    <div className="bands wrap" id="destinations">
      {bands.map((band) => (
        <section className="band" key={band.slug}>
          <div className="row">
            <div style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="panel">
                <Image src={band.image} alt={band.heading} fill sizes="(max-width: 900px) 100vw, 55vw" loading="lazy" quality={80} />
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
                    {/* The breakdown line prints our fee. It is the positioning. */}
                    <div className="brk">{offer.breakdown}</div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="side">
              <div>
                <h6>Where to stay</h6>
                <div className="rows">
                  {band.stays.length === 0 && (
                    <p className="note" style={{ margin: 0 }}>
                      We quote accommodation by hand for {band.city} — ask us and we will price it
                      with the flight.
                    </p>
                  )}
                  {band.stays.map((stay) => (
                    <div className={`r${stay.images.length > 1 ? ' wide' : ''}`} key={stay.name}>
                      {stay.images.length > 1 ? (
                        <span className="pics">
                          {stay.images.map((src) => (
                            <Image
                              key={src}
                              className="thumb"
                              src={src}
                              alt=""
                              width={104}
                              height={88}
                              loading="lazy"
                            />
                          ))}
                        </span>
                      ) : (
                        <Image
                          className="thumb"
                          src={stay.images[0] ?? '/images/thumb-stay-1.jpg'}
                          alt=""
                          width={76}
                          height={76}
                          loading="lazy"
                        />
                      )}
                      <span className="meta">
                        {stay.bookingUrl ? (
                          <a className="nm lnk" href={stay.bookingUrl} target="_blank" rel="noopener">
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
              </div>

              {band.around.length > 0 && (
                <>
                  <div className="div" />
                  <div>
                    <h6>Getting there &amp; around</h6>
                    <div className="rows">
                      {band.around.map((row) => (
                        <div className="r" key={row.name}>
                          <Image
                            className="thumb"
                            src={row.thumb}
                            alt=""
                            width={76}
                            height={76}
                            loading="lazy"
                          />
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

              <p className="note">{band.note}</p>
            </aside>
          </div>
        </section>
      ))}
    </div>
  );
}
