'use client';

import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@/lib/money';

/**
 * Payment, on eZAY's own page, wallet-first.
 *
 * Apple Pay, Google Pay and Link render as full-width buttons ABOVE the card
 * form, because the point of eZAY is that a traveller goes from a social post
 * to a booked seat without typing a card number. A wallet tap is one
 * fingerprint; a card is sixteen digits, an expiry, a CVC and usually a
 * 3-D Secure screen. The card form stays underneath for everyone else.
 *
 * Both routes end in exactly the same place, because the money order is what
 * protects the customer:
 *
 *   confirmPayment() AUTHORISES and takes nothing — the PaymentIntent was
 *   created with capture_method 'manual'. Only then does finishBooking() call
 *   /api/fares/confirm, which issues the ticket with Duffel and captures the
 *   money if, and only if, the ticket exists.
 *
 * Card fields are Stripe's own iframes. No card detail reaches this component
 * or any eZAY server.
 *
 * Wallets only appear on a registered domain over HTTPS: Apple Pay on Safari
 * with a card in Wallet, Google Pay on Chrome or Android. Where none is
 * available the express block hides itself rather than leaving a gap.
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
  /** Signed link to finish this same booking on another device. */
  payUrl?: string;
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

type Stage = 'idle' | 'authorising' | 'booking';

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
  const [stage, setStage] = useState<Stage>('idle');
  const [hasWallets, setHasWallets] = useState(false);
  /** Set once the express element has reported, so the hand-off only shows
   *  when we KNOW there is no wallet here, not merely before it has loaded. */
  const [walletsChecked, setWalletsChecked] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  // Draw the hand-off QR only when this device has no wallet of its own.
  useEffect(() => {
    if (!walletsChecked || hasWallets || !auth.payUrl) return;
    let live = true;
    QRCode.toDataURL(auth.payUrl, { margin: 1, width: 180 })
      .then((url) => {
        if (live) setQr(url);
      })
      .catch(() => {
        /* no QR is fine; the link below it still works */
      });
    return () => {
      live = false;
    };
  }, [walletsChecked, hasWallets, auth.payUrl]);

  function fail(message: string) {
    setBusy(false);
    setStage('idle');
    setError(message);
  }

  /**
   * Steps 2 and 3, server-side: book the ticket, then take the money.
   * Shared by the wallet and the card route — there is one money path, not two.
   */
  async function finishBooking() {
    setStage('booking');
    try {
      const response = await fetch('/api/fares/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderRef: auth.reference, offerId: auth.offerId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        fail(result?.error ?? 'We could not complete that booking. Nothing has been charged.');
        return;
      }
      onBooked(result?.reference ?? auth.reference, result?.warning);
    } catch {
      fail(
        `We lost the connection while confirming. Do not pay again — WhatsApp us with reference ${auth.reference} and we will tell you exactly where it got to.`
      );
    }
  }

  /** Step 1, shared: authorise the card or wallet. Nothing is taken here. */
  async function authoriseThenBook() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    setStage('authorising');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation?ref=${encodeURIComponent(auth.reference)}`,
      },
    });

    if (stripeError) {
      fail(
        stripeError.message ??
          'That payment was not accepted. Nothing has been taken — please try again.'
      );
      return;
    }

    await finishBooking();
  }

  return (
    <form
      className="paystep"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) void authoriseThenBook();
      }}
    >
      <h3>Payment</h3>
      <p className="paystep-note">
        We hold the amount on your card, book the seat with the airline, and only then take the
        payment. If the airline will not confirm it, the hold is released and you are charged
        nothing.
      </p>

      {/* One tap: Apple Pay, Google Pay, Link. */}
      <div className={hasWallets ? 'paystep-express' : 'paystep-express is-empty'}>
        <ExpressCheckoutElement
          options={{ buttonTheme: { applePay: 'black', googlePay: 'black' }, buttonHeight: 48 }}
          onReady={({ availablePaymentMethods }) => {
            setHasWallets(Boolean(availablePaymentMethods));
            setWalletsChecked(true);
          }}
          onConfirm={() => {
            if (!busy) void authoriseThenBook();
          }}
        />
        {hasWallets && (
          <div className="paystep-or">
            <span>or pay by card</span>
          </div>
        )}
      </div>

      {walletsChecked && !hasWallets && auth.payUrl && (
        <div className="paystep-handoff">
          {/* A client-generated data: URL. next/image cannot optimise one and
              would only add a round trip, so a plain img is correct here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="" width={120} height={120} />}
          <div>
            <strong>Prefer Apple Pay or Google Pay?</strong>
            <p>
              This browser has no wallet set up. Scan the code with your phone to finish the same
              booking there in one tap — nothing is charged twice, it is the same payment.
            </p>
            <a href={auth.payUrl}>Or open the link on this device</a>
          </div>
        </div>
      )}

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
