'use client';

import { useState, type FormEvent } from 'react';
import { BUDGET_BANDS } from '@/lib/enquiryOptions';

/**
 * The dark enquiry panel from the approved design.
 *
 * This is the primary revenue channel at launch, so it is deliberately short:
 * name, mobile, free-text trip, a budget chip and a WhatsApp opt-in. The
 * honeypot field is visually hidden and must stay empty.
 */
export function EnquiryPanel({
  whatsappNumber,
  phone,
  prefillTrip = '',
}: {
  whatsappNumber: string;
  phone: string;
  prefillTrip?: string;
}) {
  const [budget, setBudget] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError(null);

    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      message: String(form.get('trip') ?? ''),
      budgetBand: budget || undefined,
      whatsappOptIn: form.get('whatsappOptIn') === 'on',
      website: String(form.get('website') ?? ''),
      source: 'website',
      tripType: 'flight' as const,
    };

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? 'We could not send that. Please WhatsApp us instead.');
      }
      setReference(result?.reference ?? null);
      setStatus('sent');
    } catch (err) {
      setError((err as Error).message);
      setStatus('idle');
    }
  }

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi eZAY — ')}`;

  return (
    <section className="enq wrap" id="enquiry">
      <div>
        <h2>Tell us where and when. We&rsquo;ll come back with a real number.</h2>
        <p className="lead">
          Groups, complex routings, anything with a visa question — that&rsquo;s the stuff
          we&rsquo;re actually good at. Quote back within four working hours, and we&rsquo;ll say
          plainly if you&rsquo;re better off booking it yourself.
        </p>
        <a className="btn wa" href={waHref} target="_blank" rel="noopener">
          WhatsApp {phone}
        </a>
        <p style={{ fontSize: 13, color: 'var(--color-neutral-400)', marginTop: 12 }}>
          Usually replies within the hour
        </p>
      </div>

      {status === 'sent' ? (
        <div role="status">
          <h3 style={{ fontSize: 24, marginBottom: 8 }}>Sent — we&rsquo;ll come back within 4 hrs</h3>
          <p style={{ color: 'var(--color-neutral-400)' }}>
            {reference && (
              <>
                Your reference is <strong style={{ color: 'var(--color-bg)' }}>{reference}</strong>.{' '}
              </>
            )}
            A person reads every one of these. If it&rsquo;s urgent, WhatsApp is faster.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="two">
            <div>
              <label className="lbl" htmlFor="en">
                Name
              </label>
              <input className="input" id="en" name="name" required autoComplete="name" />
            </div>
            <div>
              <label className="lbl" htmlFor="ep">
                Mobile
              </label>
              <input className="input" id="ep" name="phone" required autoComplete="tel" type="tel" />
            </div>
          </div>

          <div>
            <label className="lbl" htmlFor="et">
              Your trip
            </label>
            <textarea
              className="input"
              id="et"
              name="trip"
              defaultValue={prefillTrip}
              placeholder="Two of us, Lagos, out 18 Dec back 3 Jan, flexible by a day either side"
            />
          </div>

          <div>
            <label className="lbl" id="budget-label">
              Budget
            </label>
            <div className="budget" role="group" aria-labelledby="budget-label">
              {BUDGET_BANDS.map((band) => (
                <button
                  key={band.value}
                  type="button"
                  aria-pressed={budget === band.value}
                  onClick={() => setBudget(budget === band.value ? '' : band.value)}
                >
                  {band.label}
                </button>
              ))}
            </div>
          </div>

          <label className="chk">
            <input type="checkbox" name="whatsappOptIn" defaultChecked /> Reply on WhatsApp —
            it&rsquo;s faster
          </label>

          {/* Honeypot. Never visible, must stay empty. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: -9999 }}
          />

          {error && (
            <p role="alert" style={{ fontSize: 13, color: 'var(--color-accent-300)', margin: 0 }}>
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send it over'}
          </button>
        </form>
      )}
    </section>
  );
}
