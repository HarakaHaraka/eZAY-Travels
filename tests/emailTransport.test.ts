import { describe, expect, it, vi } from 'vitest';

/**
 * The transport is picked purely from which keys are present, in a fixed
 * order: Graph first (Microsoft retired SMTP password login), then SMTP, then
 * Resend, then console. A wrong pick here means confirmations silently go to
 * a folder on the server instead of to a customer.
 */
async function transportWith(env: Record<string, string>) {
  for (const key of [
    'MS_GRAPH_TENANT_ID',
    'MS_GRAPH_CLIENT_ID',
    'MS_GRAPH_CLIENT_SECRET',
    'SMTP_HOST',
    'SMTP_PASS',
    'RESEND_API_KEY',
    'EMAIL_FROM',
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  vi.resetModules();
  const { config } = await import('@/lib/config');
  return config.email;
}

describe('email transport selection', () => {
  it('is console when nothing is configured', async () => {
    expect((await transportWith({})).transport).toBe('console');
  });

  it('prefers Microsoft Graph when all three Graph values are present', async () => {
    const email = await transportWith({
      MS_GRAPH_TENANT_ID: 't',
      MS_GRAPH_CLIENT_ID: 'c',
      MS_GRAPH_CLIENT_SECRET: 's',
      SMTP_HOST: 'smtp.office365.com',
      SMTP_PASS: 'x',
      RESEND_API_KEY: 're_x',
    });
    expect(email.transport).toBe('graph');
  });

  it('does not count a half-filled Graph config', async () => {
    const email = await transportWith({ MS_GRAPH_TENANT_ID: 't', RESEND_API_KEY: 're_x' });
    expect(email.transport).toBe('resend');
  });

  it('customers see the company address, not the login account', async () => {
    const email = await transportWith({ SMTP_HOST: 'h', SMTP_PASS: 'p', SMTP_USER: 'admin@harakatransport.co.uk' });
    expect(email.fromAddress).toBe('manager@ezaytravels.co.uk');
  });
});
