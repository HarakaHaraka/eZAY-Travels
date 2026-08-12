import 'server-only';
import { Duffel } from '@duffel/api';
import { config } from '../config';

export interface DuffelHealth {
  mode: 'fixtures' | 'live';
  ok: boolean;
  detail: string;
}

/**
 * Confirms the configured Duffel token actually connects — server-side only,
 * so the token never leaves the backend. This is the safe way to verify a
 * real token: paste it into .env, restart, and press the button in admin.
 *
 * Uses a cheap authenticated read (list one airline) rather than an offer
 * request, so it proves the credential works without spending a search that
 * Duffel may bill for.
 */
export async function checkDuffelConnection(): Promise<DuffelHealth> {
  if (config.duffel.demoMode) {
    return {
      mode: 'fixtures',
      ok: true,
      detail: 'DUFFEL_API_KEY is blank — the app is serving fixture data. Add a test key to go live.',
    };
  }

  try {
    const client = new Duffel({ token: config.duffel.apiKey });
    const { data } = await client.airlines.list({ limit: 1 });
    const sample = data[0]?.name ? ` (reached Duffel; sample airline: ${data[0].name})` : '';
    return {
      mode: 'live',
      ok: true,
      detail: `Token accepted — a live authenticated call to Duffel succeeded${sample}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      mode: 'live',
      ok: false,
      detail: `Duffel rejected the call: ${message}. Check the token is a valid TEST key and has not been revoked.`,
    };
  }
}
