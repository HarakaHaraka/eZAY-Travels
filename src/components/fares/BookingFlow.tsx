'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { formatMoney } from '@/lib/money';

export interface StayOption {
  supplierStayId: string;
  name: string;
  location: string;
  nights: number;
  ratingStars?: number;
  sellMinor: number;
}

/**
 * The attach step, before payment. Hotel and insurance are shown by default,
 * insurance pre-selected — the brief is explicit that they are shown, not
 * hidden. Add-on prices are re-derived server-side at checkout; the values
 * here are for display only.
 */
export function BookingFlow({
  offerId,
  passengerCount,
  flightTotalMinor,
  currency,
  breakdown,
  stays,
  insurance,
}: {
  offerId: string;
  passengerCount: number;
  flightTotalMinor: number;
  currency: string;
  breakdown: string;
  stays: StayOption[];
  insurance: { description: string; sellMinor: number };
}) {
  const [passengers, setPassengers] = useState(
    Array.from({ length: passengerCount }, () => ({ givenName: '', familyName: '' }))
  );
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [wantsInsurance, setWantsInsurance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStay = stays.find((s) => s.supplierStayId === selectedStayId) ?? null;

  const totalMinor = useMemo(() => {
    let total = flightTotalMinor;
    if (selectedStay) total += selectedStay.sellMinor;
    if (wantsInsurance) total += insurance.sellMinor;
    return total;
  }, [flightTotalMinor, selectedStay, wantsInsurance, insurance.sellMinor]);

  function updatePassenger(index: number, field: 'givenName' | 'familyName', value: string) {
    setPassengers((current) => current.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/fares/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId,
          passengers,
          contactEmail: email,
          contactPhone: phone || undefined,
          stayId: selectedStayId,
          wantsInsurance,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'We could not start checkout.');
      window.location.href = result.redirectUrl;
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,0.6fr)', marginTop: 24 }}
      className="booking-grid"
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <section className="card elev-sm">
          <h2 style={{ fontSize: 19 }}>Who&rsquo;s travelling</h2>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
            Names must match the passport exactly — airlines charge to change them.
          </p>
          <div style={{ display: 'grid', gap: 14, marginTop: 8 }}>
            {passengers.map((passenger, index) => (
              <div key={index} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <div className="field">
                  <label htmlFor={`given-${index}`}>
                    Traveller {index + 1} — first name(s)
                  </label>
                  <input
                    id={`given-${index}`}
                    className="input"
                    required
                    value={passenger.givenName}
                    onChange={(e) => updatePassenger(index, 'givenName', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`family-${index}`}>Last name</label>
                  <input
                    id={`family-${index}`}
                    className="input"
                    required
                    value={passenger.familyName}
                    onChange={(e) => updatePassenger(index, 'familyName', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
            <div className="field">
              <label htmlFor="email">Email for the confirmation</label>
              <input
                id="email"
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card elev-sm">
          <h2 style={{ fontSize: 19 }}>Add a hotel</h2>
          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
            Booked on the same reference, so if the flight moves we move the hotel with it.
          </p>
          {stays.length === 0 ? (
            <p style={{ fontSize: 14, background: 'var(--color-neutral-100)', padding: 12, borderRadius: 14 }}>
              We can&rsquo;t pull live hotel rates for this destination right now — tell us your dates
              and we&rsquo;ll quote it by hand with the flight.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
              {stays.map((stay) => {
                const checked = selectedStayId === stay.supplierStayId;
                return (
                  <label
                    key={stay.supplierStayId}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: 14,
                      borderRadius: 18,
                      cursor: 'pointer',
                      border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-divider)'}`,
                      background: checked ? 'var(--color-accent-100)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="stay"
                      checked={checked}
                      onChange={() => setSelectedStayId(stay.supplierStayId)}
                      style={{ marginTop: 4 }}
                    />
                    <span style={{ flex: 1 }}>
                      <strong>{stay.name}</strong>
                      {stay.ratingStars ? (
                        <span className="text-muted"> {'★'.repeat(stay.ratingStars)}</span>
                      ) : null}
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--color-neutral-700)' }}>
                        {stay.location} · {stay.nights} night{stay.nights > 1 ? 's' : ''}
                      </span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)' }}>
                      {formatMoney(stay.sellMinor, currency)}
                    </span>
                  </label>
                );
              })}
              {selectedStayId !== null && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedStayId(null)}
                  style={{ justifySelf: 'start' }}
                >
                  No thanks, flight only
                </button>
              )}
            </div>
          )}
        </section>

        <section className="card elev-sm">
          <h2 style={{ fontSize: 19 }}>Travel insurance</h2>
          <label
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              padding: 14,
              borderRadius: 18,
              cursor: 'pointer',
              marginTop: 6,
              border: `1px solid ${wantsInsurance ? 'var(--color-accent)' : 'var(--color-divider)'}`,
              background: wantsInsurance ? 'var(--color-accent-100)' : 'transparent',
            }}
          >
            <input
              type="checkbox"
              checked={wantsInsurance}
              onChange={(e) => setWantsInsurance(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span style={{ flex: 1 }}>
              <strong>{insurance.description}</strong>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--color-neutral-700)' }}>
                Medical, cancellation and baggage cover for the whole trip.
              </span>
            </span>
            <span style={{ fontFamily: 'var(--font-heading)' }}>
              {formatMoney(insurance.sellMinor, currency)}
            </span>
          </label>
        </section>
      </div>

      <aside style={{ alignSelf: 'start', position: 'sticky', top: 16 }}>
        <div className="card elev-md">
          <h2 style={{ fontSize: 19 }}>Your total</h2>
          <div style={{ display: 'grid', gap: 8, fontSize: 14, marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span className="text-muted">
                Flights ({passengerCount} traveller{passengerCount > 1 ? 's' : ''})
              </span>
              <span>{formatMoney(flightTotalMinor, currency)}</span>
            </div>
            <div className="brk" style={{ fontSize: 12 }}>{breakdown}</div>
            {selectedStay && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="text-muted">{selectedStay.name}</span>
                <span>{formatMoney(selectedStay.sellMinor, currency)}</span>
              </div>
            )}
            {wantsInsurance && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="text-muted">Travel insurance</span>
                <span>{formatMoney(insurance.sellMinor, currency)}</span>
              </div>
            )}
          </div>
          <div className="hr" />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <strong>Total</strong>
            <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 26 }}>
              {formatMoney(totalMinor, currency)}
            </strong>
          </div>

          {error && (
            <p role="alert" style={{ marginTop: 12, fontSize: 14, color: 'var(--color-accent-700)' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Taking you to payment…' : 'Pay securely'}
          </button>
          <p className="text-muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Payment is handled on our provider&rsquo;s hosted page. We never see your card details.
          </p>
        </div>
      </aside>
    </form>
  );
}
