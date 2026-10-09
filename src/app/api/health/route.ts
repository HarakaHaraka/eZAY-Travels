import { NextResponse } from 'next/server';
import { accreditationClaim, canSellFlights, flightOnlyAgentMode } from '@/lib/accreditation';
import { company, config } from '@/lib/config';

/**
 * Liveness endpoint, and the one place to CHECK WHAT THE LIVE SITE IS DOING.
 *
 * It was a keep-alive ping for the free Render instance (it deliberately does
 * not touch the database, so pinging it every few minutes costs nothing). It
 * now also answers, in plain words, the questions you would otherwise have to
 * take on trust: is flight checkout actually on, which WhatsApp number is the
 * bubble using, is any protection claim being rendered.
 *
 * Every value is READ FROM THE RUNNING CONFIG. Nothing here is hardcoded, so
 * what this endpoint says is what customers are actually getting. No secret is
 * exposed — only whether each key is present.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const claim = accreditationClaim();

  return NextResponse.json({
    status: 'ok',
    service: 'ezay-travels',
    time: new Date().toISOString(),

    checks: {
      flightCheckout: canSellFlights()
        ? 'ON — customers can pay by card for flights'
        : 'OFF — customers get the enquiry form instead. Set FLIGHT_ONLY_AGENT_MODE=true in Render.',
      flightOnlyAgentMode: flightOnlyAgentMode(),
      protectionClaimShown: claim
        ? `YES — ${claim.holderName} (${claim.number})`
        : 'NO — the site makes no ATOL claim, which is correct for flight-only agent sales',
      whatsAppNumber: config.contact.whatsapp,
      contactEmail: company.email,
      companyNumber: company.number,
      icoReference: company.icoReference || 'not set yet',
      duffel: config.duffel.demoMode
        ? 'DEMO — no DUFFEL_API_KEY set, fares are fixtures'
        : 'LIVE — real fares',
      payments: config.payments.demoMode
        ? 'DEMO — no STRIPE_SECRET_KEY set, checkout uses the in-app demo page'
        : 'LIVE — Stripe hosted checkout',
      email: config.email.transport,
      siteUrl: config.siteUrl,
    },
  });
}
