'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Stands in for the payment provider's hosted page when STRIPE_SECRET_KEY is
 * blank. Never reachable with a real key — the provider returns a real
 * hosted-checkout URL instead.
 */
export default function DemoPaymentPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: 80, textAlign: 'center' }}>Loading…</div>}>
      <DemoPayment />
    </Suspense>
  );
}

function DemoPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = searchParams.get('session') ?? '';
  const reference = searchParams.get('ref') ?? '';

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/dev/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'Simulated payment failed.');
      router.push(`/book/confirmation?ref=${encodeURIComponent(reference)}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 460, padding: '80px 20px', textAlign: 'center' }}>
      <span className="tag tag-accent" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Demo checkout — no live payment key
      </span>
      <h1 style={{ fontSize: 26, marginTop: 18 }}>Pay for booking {reference}</h1>
      <p style={{ color: 'var(--color-neutral-800)' }}>
        In production this is the payment provider&rsquo;s own hosted page. Locally, this button
        drives the same confirmation path a real webhook would.
      </p>
      {error && (
        <p role="alert" style={{ color: 'var(--color-accent-700)', fontSize: 14 }}>
          {error}
        </p>
      )}
      <button onClick={pay} disabled={busy} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
        {busy ? 'Processing…' : 'Simulate successful payment'}
      </button>
    </div>
  );
}
