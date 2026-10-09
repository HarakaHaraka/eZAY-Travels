import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * The health endpoint is how Zay verifies the live site without trusting
 * anyone's word, so its two headline answers are tested.
 */
const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.ATOL_HOLDER_NAME = '';
  process.env.ATOL_NUMBER = '';
});
afterEach(() => {
  process.env = { ...ORIGINAL };
});

async function readChecks() {
  const { GET } = await import('@/app/api/health/route');
  return (await GET().json()).checks as Record<string, unknown>;
}

describe('GET /api/health', () => {
  it('says checkout is OFF and names the missing switch', async () => {
    process.env.FLIGHT_ONLY_AGENT_MODE = 'false';
    const checks = await readChecks();
    expect(String(checks.flightCheckout)).toMatch(/^OFF/);
    expect(String(checks.flightCheckout)).toContain('FLIGHT_ONLY_AGENT_MODE=true');
  });

  it('says checkout is ON, with no protection claim, once the switch is set', async () => {
    process.env.FLIGHT_ONLY_AGENT_MODE = 'true';
    const checks = await readChecks();
    expect(String(checks.flightCheckout)).toMatch(/^ON/);
    expect(String(checks.protectionClaimShown)).toMatch(/^NO/);
  });
});
