import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * The money order: authorise, book, then capture.
 *
 * Before this was built, nothing in the application ever called Duffel's
 * createOrder — a customer could pay and never receive a ticket. These checks
 * are deliberately structural: they assert the confirm route still calls
 * Duffel BEFORE it captures, and still releases the hold when Duffel fails.
 * A refactor that reversed those two would be the single most expensive bug
 * this codebase could ship, so it is pinned here rather than left to memory.
 */

const ROUTE = path.join(process.cwd(), 'src', 'app', 'api', 'fares', 'confirm', 'route.ts');

describe('the booking confirm route', () => {
  it('books with Duffel before it captures the money', async () => {
    const body = await readFile(ROUTE, 'utf8');
    const bookAt = body.indexOf('createOrder(');
    const captureAt = body.indexOf('provider.capture(');

    expect(bookAt, 'the route must call Duffel createOrder').toBeGreaterThan(-1);
    expect(captureAt, 'the route must capture the payment').toBeGreaterThan(-1);
    expect(bookAt, 'Duffel must be called BEFORE the capture').toBeLessThan(captureAt);
  });

  it('releases the authorisation when the airline refuses', async () => {
    const body = await readFile(ROUTE, 'utf8');
    expect(body).toContain('cancelAuthorization');
    // The release must sit in the failure path, before the capture.
    expect(body.indexOf('cancelAuthorization')).toBeLessThan(body.indexOf('provider.capture('));
  });

  it('refuses to proceed unless the provider confirms the money is held', async () => {
    const body = await readFile(ROUTE, 'utf8');
    expect(body).toContain('authorizationState');
    expect(body).toContain("'requires_capture'");
  });

  it('never double-books an order that already has a supplier reference', async () => {
    const body = await readFile(ROUTE, 'utf8');
    expect(body).toContain('if (order.supplierRef)');
  });

  it('flags, and does not cancel, a ticket issued but not paid for', async () => {
    const body = await readFile(ROUTE, 'utf8');
    expect(body).toContain('requires_attention');
  });
});

describe('the authorisation itself', () => {
  it('is created with manual capture, so nothing is taken up front', async () => {
    const provider = await readFile(
      path.join(process.cwd(), 'src', 'lib', 'payments', 'stripeDirect.ts'),
      'utf8'
    );
    expect(provider).toContain("capture_method: 'manual'");
  });
});
