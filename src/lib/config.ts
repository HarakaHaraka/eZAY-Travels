import 'server-only';

/**
 * Environment configuration.
 *
 * .env.example carries trailing `# comments` on several values, and dotenv
 * only strips those in some versions — so every read goes through clean()
 * rather than trusting process.env verbatim.
 *
 * Money is integer minor units (pence) everywhere. The markup percentages are
 * FRACTIONS in env (0.05 = 5%), matching .env.example — not whole percents.
 */

function clean(name: string): string {
  const raw = process.env[name];
  if (raw === undefined) return '';
  // Strip an unquoted trailing comment, then surrounding quotes and space.
  return raw
    .replace(/\s+#.*$/, '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function fraction(name: string, fallback: number): number {
  const raw = clean(name);
  if (raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number (a fraction, e.g. 0.05 for 5%). Got: ${raw}`);
  }
  return value;
}

function minorUnits(name: string, fallback: number): number {
  const raw = clean(name);
  if (raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer in minor units (pence). Got: ${raw}`);
  }
  return value;
}

export type PaymentMode = 'stripe_direct' | 'collect_and_remit';

function paymentMode(): PaymentMode {
  const raw = clean('PAYMENT_MODE') || 'stripe_direct';
  if (raw !== 'stripe_direct' && raw !== 'collect_and_remit') {
    throw new Error(`PAYMENT_MODE must be stripe_direct or collect_and_remit. Got: ${raw}`);
  }
  return raw;
}

/**
 * Public company facts. These are not secrets and are the same on every
 * environment, so they live here rather than in env — a blank env must never
 * put a placeholder number or address on the public site.
 * Source: Companies House, company 17394853, incorporated 12 August 2026.
 */
export const company = {
  legalName: 'eZAY Travels and Tours Ltd',
  tradingName: 'eZAY Travels',
  number: '17394853',
  registeredIn: 'England and Wales',
  address: '181 Barcombe Avenue, London SW2 3BH',
  director: 'Zainab Ahmed Husein (known as Zay)',
  email: clean('COMPANY_EMAIL') || 'manager@ezaytravels.co.uk',
  phone: clean('COMPANY_PHONE') || '+44 7849 549140',
  /** Digits only, international format, for wa.me links. */
  whatsapp: clean('WHATSAPP_NUMBER') || '447849549140',
  website: 'ezaytravels.co.uk',
  insurance:
    'Professional indemnity and public liability insurance arranged through Campbell Irvine (Insurance Brokers) Ltd, in force from 7 October 2026.',
  /** Blank until the ICO reference arrives; the footer then prints it. */
  icoReference: clean('ICO_REFERENCE'),
} as const;

const duffelKey = clean('DUFFEL_API_KEY');
const stripeKey = clean('STRIPE_SECRET_KEY');
const smtpHost = clean('SMTP_HOST');
const smtpPass = clean('SMTP_PASS');
const resendKey = clean('RESEND_API_KEY');
const graphTenant = clean('MS_GRAPH_TENANT_ID');
const graphClient = clean('MS_GRAPH_CLIENT_ID');
const graphSecret = clean('MS_GRAPH_CLIENT_SECRET');

export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  siteUrl: (clean('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000').replace(/\/$/, ''),

  duffel: {
    apiKey: duffelKey,
    /** No key ⇒ fixture data. Never true in production; see assertProductionReady. */
    demoMode: duffelKey === '',
  },

  payments: {
    mode: paymentMode(),
    stripeSecretKey: stripeKey,
    stripePublishableKey: clean('STRIPE_PUBLISHABLE_KEY'),
    stripeWebhookSecret: clean('STRIPE_WEBHOOK_SECRET'),
    /** No key ⇒ in-app demo checkout page driving the same confirmation path. */
    demoMode: stripeKey === '',
  },

  email: {
    smtpHost,
    smtpPort: Number(clean('SMTP_PORT') || 587),
    /** The account that LOGS IN to the mail server. May be a different mailbox
     *  from the address customers see — e.g. the Microsoft 365 licensed user that
     *  owns the shared manager@ mailbox. */
    smtpUser: clean('SMTP_USER'),
    smtpPass,
    /** The address customers see and reply to. Defaults to the company email. */
    fromAddress: clean('EMAIL_FROM') || company.email,
    resendApiKey: resendKey,
    /** Microsoft Graph app-only sending: no SMTP, no DNS, no password login. */
    graph: { tenantId: graphTenant, clientId: graphClient, clientSecret: graphSecret },
    notifyEmail: clean('NOTIFY_EMAIL') || company.email,
    /** Which transport is actually usable, in priority order. */
    transport:
      graphTenant !== '' && graphClient !== '' && graphSecret !== ''
        ? ('graph' as const)
        : smtpHost !== '' && smtpPass !== ''
          ? ('smtp' as const)
          : resendKey !== ''
            ? ('resend' as const)
            : ('console' as const),
  },

  affiliate: {
    /** Network tracking link with `{url}` where the hotel's page goes. Blank ⇒ plain links. */
    linkTemplate: clean('AFFILIATE_LINK_TEMPLATE'),
    /** Travelpayouts account number (public). Loads their Drive script on content pages. */
    travelpayoutsId: clean('TRAVELPAYOUTS_ID'),
  },

  markup: {
    /** Fractions, not whole percents. 0.05 === 5%. */
    shortHaulPct: fraction('MARKUP_SHORT_HAUL_PCT', 0.05),
    longHaulPct: fraction('MARKUP_LONG_HAUL_PCT', 0.08),
    packagePct: fraction('MARKUP_PACKAGE_PCT', 0.1),
    /** Hard floor per ticket, applied AFTER the percentage. */
    minPerTicketMinor: minorUnits('MARKUP_MIN_PER_TICKET_MINOR', 2000),
  },

  contact: {
    whatsapp: clean('WHATSAPP_NUMBER') || company.whatsapp,
    phone: clean('COMPANY_PHONE') || company.phone,
    email: clean('NOTIFY_EMAIL') || company.email,
  },

  company,

  admin: {
    password: clean('ADMIN_PASSWORD'),
    sessionSecret: clean('ADMIN_SESSION_SECRET') || clean('ADMIN_PASSWORD') || 'dev-only-secret',
  },

  /** Single constant for the hero rotation, per the build brief. */
  heroRotationMs: Number(clean('HERO_ROTATION_MS') || 5000),
} as const;

/** Refuses to run in production on a demo fallback or a missing secret. */
export function assertProductionReady(): void {
  if (!config.isProduction) return;
  const problems: string[] = [];
  if (config.duffel.demoMode) problems.push('DUFFEL_API_KEY is blank');
  if (config.payments.demoMode) problems.push('STRIPE_SECRET_KEY is blank');
  if (!config.payments.demoMode && config.payments.stripeWebhookSecret === '') {
    problems.push('STRIPE_WEBHOOK_SECRET is blank');
  }
  if (config.admin.password === '') problems.push('ADMIN_PASSWORD is blank');
  if (config.email.transport === 'console') problems.push('no email transport configured');
  if (problems.length > 0) {
    throw new Error(`Refusing to run in production: ${problems.join(', ')}`);
  }
}
