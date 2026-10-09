'use client';

import { useState } from 'react';
import { PaymentStep, type Authorization } from './PaymentStep';

/**
 * Client wrapper for the "finish on your phone" page, which is a server
 * component and so cannot hold the booked state itself.
 */
export function ResumePayment({
  auth,
  amountMinor,
  currency,
}: {
  auth: Authorization;
  amountMinor: number;
  currency: string;
}) {
  const [booked, setBooked] = useState<{ reference: string; warning?: string } | null>(null);

  if (booked) {
    return (
      <section>
        <h2 style={{ fontSize: 22 }}>You&rsquo;re booked.</h2>
        <p>
          Reference <strong>{booked.reference}</strong>. The e-ticket and confirmation are on their
          way to you.
        </p>
        {booked.warning && <p role="alert">{booked.warning}</p>}
      </section>
    );
  }

  return (
    <PaymentStep
      auth={auth}
      amountMinor={amountMinor}
      currency={currency}
      onBooked={(reference, warning) => setBooked({ reference, warning })}
    />
  );
}
