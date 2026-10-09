import type { Metadata } from 'next';
import { accreditationClaim, canSellFlights } from '@/lib/accreditation';
import { BUILD_MARKER } from '@/lib/buildMarker';
import { company, config } from '@/lib/config';
import { paymentProvider } from '@/lib/payments';

/**
 * A plain-English status page for the owner.
 *
 * /api/health returns the same facts as JSON, but robots.ts disallows /api/,
 * so nothing that respects robots.txt (including the tooling used to check
 * this site) can read it. This page sits on an allowed path so the live
 * deployment can be verified from outside without a dashboard login.
 *
 * Every value is read from the RUNNING config, so what this page says is what
 * customers are actually getting. No secret is printed — only whether each
 * key is present. It is noindex so it never appears in search results.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Site status',
  robots: { index: false, follow: false },
};

export default async function StatusPage() {
  const claim = accreditationClaim();

  // Asking Stripe directly, because a browser with no wallet button looks
  // exactly like a broken configuration and guessing between the two wastes
  // an evening.
  let wallets: Awaited<ReturnType<ReturnType<typeof paymentProvider>['walletStatus']>> = null;
  let walletError: string | null = null;
  try {
    wallets = await paymentProvider().walletStatus();
  } catch (error) {
    walletError = error instanceof Error ? error.message : 'could not reach Stripe';
  }

  const rows: Array<[label: string, value: string, good: boolean]> = [
    ['Build marker', BUILD_MARKER, true],
    [
      'Flight checkout',
      canSellFlights()
        ? 'ON — customers can pay by card for flights'
        : 'OFF — customers get the enquiry form. Set FLIGHT_ONLY_AGENT_MODE=true in Render.',
      canSellFlights(),
    ],
    [
      'Protection claim shown',
      claim ? `YES — ${claim.holderName} (${claim.number})` : 'NO — correct for flight-only agent sales',
      true,
    ],
    ['WhatsApp number in use', config.contact.whatsapp, config.contact.whatsapp === '447849549140'],
    ['Contact email', company.email, company.email.endsWith('@ezaytravels.co.uk')],
    ['Company number', company.number, company.number === '17394853'],
    ['ICO reference', company.icoReference || 'not set yet', company.icoReference !== ''],
    [
      'Duffel',
      config.duffel.demoMode ? 'DEMO — no API key, fares are fixtures' : 'LIVE — real fares',
      !config.duffel.demoMode,
    ],
    [
      'Payments',
      config.payments.demoMode ? 'DEMO — no Stripe key, in-app demo checkout' : 'LIVE — Stripe, on our own page',
      !config.payments.demoMode,
    ],
    [
      'Stripe webhook secret',
      config.payments.stripeWebhookSecret
        ? 'Set — refunds and disputes will reach the right order'
        : 'NOT SET — add STRIPE_WEBHOOK_SECRET in Render (Stripe: Developers, Webhooks, Reveal signing secret)',
      config.payments.stripeWebhookSecret !== '',
    ],
    [
      'Email sending',
      config.email.transport === 'console'
        ? 'NOT SENDING — no Microsoft Graph, SMTP or Resend key'
        : config.email.transport === 'graph'
          ? 'Microsoft 365 (Graph API) — sending as ' + config.email.fromAddress
          : config.email.transport,
      config.email.transport !== 'console',
    ],
    ['Site URL', config.siteUrl, true],
  ];

  const walletRows: Array<[label: string, value: string, good: boolean]> = walletError
    ? [['Wallets', `Could not check with Stripe — ${walletError}`, false]]
    : wallets === null
      ? [['Wallets', 'Not checked — Stripe is not configured yet', false]]
      : [
          [
            'Domain registered for wallets',
            wallets.registered
              ? `${wallets.domainName} — enabled`
              : `${wallets.domainName} — NOT registered. Stripe: Settings, Payments, Payment method domains.`,
            wallets.registered,
          ],
          [
            'Apple Pay',
            wallets.applePay ? 'Live — shows on Safari and iPhone' : 'Not active on this domain',
            wallets.applePay,
          ],
          [
            'Google Pay',
            wallets.googlePay ? 'Live — shows on Chrome and Android' : 'Not active on this domain',
            wallets.googlePay,
          ],
          [
            'Link',
            wallets.link ? 'Live — one-click on any browser' : 'Not active on this domain',
            wallets.link,
          ],
        ];

  return (
    <main className="legal wrap">
      <h1>Site status</h1>
      <p className="legal-lead">
        What this deployment is actually doing, read from the running configuration. Not indexed by
        search engines. Checked at {new Date().toISOString()}.
      </p>
      <table>
        <tbody>
          {rows.map(([label, value, good]) => (
            <tr key={label}>
              <th style={{ width: '32%' }}>{label}</th>
              <td>
                <span aria-hidden="true" style={{ marginRight: 8 }}>
                  {good ? '✅' : '⚠️'}
                </span>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ marginTop: 28 }}>Wallet payments</h2>
      <table>
        <tbody>
          {walletRows.map(([label, value, good]) => (
            <tr key={label}>
              <th style={{ width: '32%' }}>{label}</th>
              <td>
                <span aria-hidden="true" style={{ marginRight: 8 }}>
                  {good ? '✅' : '⚠️'}
                </span>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="legal-note" style={{ marginTop: 12 }}>
        These come from Stripe itself, so they are what customers actually get. A wallet showing
        as live here but no button on your own screen means that browser has no wallet set up —
        not that the site is broken.
      </p>

      <p className="legal-note">
        If the build marker above is not the one you expect, this service has not deployed the
        latest commit from the main branch.
      </p>
    </main>
  );
}
