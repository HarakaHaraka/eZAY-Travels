import type { Metadata } from 'next';
import { accreditationClaim, canSellFlights } from '@/lib/accreditation';
import { BUILD_MARKER } from '@/lib/buildMarker';
import { company, config } from '@/lib/config';

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

export default function StatusPage() {
  const claim = accreditationClaim();

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
      config.payments.demoMode ? 'DEMO — no Stripe key, in-app demo checkout' : 'LIVE — Stripe checkout',
      !config.payments.demoMode,
    ],
    [
      'Email sending',
      config.email.transport === 'console' ? 'NOT SENDING — no SMTP or Resend key' : config.email.transport,
      config.email.transport !== 'console',
    ],
    ['Site URL', config.siteUrl, true],
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
      <p className="legal-note">
        If the build marker above is not the one you expect, this service has not deployed the
        latest commit from the main branch.
      </p>
    </main>
  );
}
