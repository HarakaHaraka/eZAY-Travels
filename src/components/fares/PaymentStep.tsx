'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useMemo, useState } from 'react';
import { formatMoney } from '@/lib/money';

/**
 * Payment, on eZAY's own page.
 *
 * The card fields are Stripe's Payment Element — Stripe-hosted iframes mounted
 * inside this page. The customer never leaves ezaytravels.co.uk, and no card
 * detail ever reaches an eZAY server or this component's state.
 *
 * The order of operations is the whole point:
 *
 *   confirmPayment() authorises the card and takes NOTHING, because the
 *   PaymentIntent was created with capture_method 'manual'. Only then do we
 *   call /api/fares/confirm, which books the ticket with Duffel and captures
 *   the money if, and only if, the ticket was issued.
 *
 * redirect: 'if_required' keeps the customer here for ordinary cards and
 * hands them to their bank only when 3-D Secure actually demands it.
 */

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(publishableKey: string) {
  if (stripePromise === null) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

export interface Authorization {
  reference: string;
  offerId: string;
  clientSecret: string;
  publishableKey: string;
}

export function PaymentStep({
  auth,
  amountMinor,
  currency,
  onBooked,
}: {
  auth: Authorization;
  amountMinor: number;
  currency: string;
  onBooked: (reference: string, warning?: string) => void;
}) {
  const stripe = useMemo(() => getStripe(auth.publishableKey), [auth.publishableKey]);

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret: auth.clientSecret,
        appearance: { theme: 'flat', variables: { borderRadius: '14px', fontSizeBase: '15px' } },
      }}
    >
      <PayForm auth={auth} amountMinor={amountMinor} currency={currency} onBooked={onBooked} />
    </Elements>
  );
}

function PayForm({
  auth,
  amountMinor,
  currency,
  onBooked,
}: {
  auth: Authorization;
  amountMinor: number;
  currency: string;
  onBooked: (reference: string, warning?: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'authorising' | 'booking'>('idle');

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || busy) return;

    setBusy(true);
    setError(null);
    setStage('authorising');

    // Step 1: authorise. Nothing is taken from the card here.
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation?ref=${encodeURIComponent(auth.reference)}`,
      },
    });

    if (stripeError) {
      setBusy(false);
      setStage('idle');
      setError(
        stripeError.message ??
          'That card was not accepted. Nothing has been taken — please try another card.'
      );
      return;
    }

    // Step 2 and 3: book the ticket, then capture. Server-side.
    setStage('booking');
    try {
      const response = await fetch('/api/fares/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderRef: auth.reference, offerId: auth.offerId }),
      });
      const result = await response.json();

      if (!response.ok) {
        setBusy(false);
        setStage('idle');
        setError(result?.error ?? 'We could not complete that booking. Nothing has been charged.');
        return;
      }

      onBooked(result.reference ?? auth.reference, result.warning);
    } catch {
      setBusy(false);
      setStage('idle');
      setError(
        'We lost the connection while confirming. Do not pay again — WhatsApp us with reference ' +
          auth.reference +
          ' and we will tell you exactly where it got to.'
      );
    }
  }

  return (
    <form onSubmit={handlePay} className="paystep">
      <h3>Payment</h3>
      <p className="paystep-note">
        We hold the amount on your card, book the seat with the airline, and only then take the
        payment. If the airline will not confirm it, the hold is released and you are charged
        nothing.
      </p>

      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p className="paystep-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary btn-block" type="submit" disabled={!stripe || busy}>
        {stage === 'authorising'
          ? 'Checking your card…'
          : stage === 'booking'
            ? 'Booking your seat…'
            : `Pay ${formatMoney(amountMinor, currency)}`}
      </button>

      <p className="paystep-fine">
        Booking reference {auth.reference}. Tickets are issued immediately and are not ATOL
        protected. We recommend travel insurance for every trip.
      </p>
    </form>
  );
}
