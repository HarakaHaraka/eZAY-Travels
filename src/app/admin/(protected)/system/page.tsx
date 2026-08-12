import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { config } from '@/lib/config';
import { checkDuffelConnection, type DuffelHealth } from '@/lib/duffel/health';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'System', robots: { index: false, follow: false } };

/** The connection result is passed back through the URL after the test runs. */
function resultFromSearch(searchParams: { duffel?: string }): DuffelHealth | null {
  if (!searchParams.duffel) return null;
  try {
    return JSON.parse(decodeURIComponent(searchParams.duffel)) as DuffelHealth;
  } catch {
    return null;
  }
}

function Row({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' }) {
  const cls = tone === 'good' ? 'text-[#1a5852]' : tone === 'warn' ? 'text-[#9c4514]' : 'text-ink';
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-[#556974]">{label}</span>
      <span className={`text-sm font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

export default function SystemPage({ searchParams }: { searchParams: { duffel?: string } }) {
  const duffelResult = resultFromSearch(searchParams);

  async function testDuffel() {
    'use server';
    const health = await checkDuffelConnection();
    revalidatePath('/admin/system');
    redirect(`/admin/system?duffel=${encodeURIComponent(JSON.stringify(health))}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">System &amp; integrations</h1>
      <p className="mt-1 max-w-prose text-[#556974]">
        How the backend is wired to its suppliers. Every secret lives server-side — nothing here is
        ever sent to a browser.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Flights — Duffel</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#556974]">
            The browser never talks to Duffel. It calls our own <code>/api/fares/search</code>, which
            runs on the server, holds the token, and makes the Duffel request — exactly the backend
            Duffel requires between your frontend and their API.
          </p>
          <div className="mt-4">
            <Row
              label="Token"
              value={config.duffel.demoMode ? 'not set — using fixtures' : 'set (server-side)'}
              tone={config.duffel.demoMode ? 'warn' : 'good'}
            />
            <Row label="Gateway" value={config.duffel.demoMode ? 'MockFlightGateway' : 'DuffelFlightGateway'} />
          </div>

          <form action={testDuffel} className="mt-4">
            <button type="submit" className="btn btn-primary">
              Test Duffel connection
            </button>
          </form>

          {duffelResult && (
            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                duffelResult.ok
                  ? 'border-[#2f8f86] bg-[#e6f6f4] text-[#123d39]'
                  : 'border-[#9c4514] bg-[#fff2e9] text-[#9c4514]'
              }`}
            >
              <strong>{duffelResult.ok ? 'OK' : 'Problem'}</strong> · {duffelResult.mode}
              <p className="mt-1 leading-relaxed">{duffelResult.detail}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Payments &amp; email</h2>
          <div className="mt-4">
            <Row label="Payment mode" value={config.payments.mode} />
            <Row
              label="Stripe key"
              value={config.payments.demoMode ? 'not set — demo checkout' : 'set (server-side)'}
              tone={config.payments.demoMode ? 'warn' : 'good'}
            />
            <Row
              label="Webhook secret"
              value={config.payments.stripeWebhookSecret === '' ? 'not set' : 'set'}
              tone={
                !config.payments.demoMode && config.payments.stripeWebhookSecret === '' ? 'warn' : 'default'
              }
            />
            <Row label="Email transport" value={config.email.transport} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#718793]">
            Stripe is used only through hosted checkout, and its SDK is confined to the payments
            module — the same isolation as the Duffel token.
          </p>
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold text-ink">Going live with your Duffel token</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[#556974]">
          <li>
            Put your <strong>test</strong> token in <code>.env</code> as{' '}
            <code>DUFFEL_API_KEY=duffel_test_…</code> — never in the frontend, never committed.
          </li>
          <li>Restart the app. It switches from the mock to the live gateway automatically.</li>
          <li>Press <strong>Test Duffel connection</strong> above to confirm the token is accepted.</li>
          <li>Search a real route on the site — the fares now come from Duffel, priced with our markup.</li>
        </ol>
      </div>
    </div>
  );
}
