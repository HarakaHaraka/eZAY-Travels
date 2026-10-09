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

describe('wallet payments take the same protected path', () => {
  it('routes Apple Pay and Google Pay through the same authorise-then-book code', async () => {
    const component = await readFile(
      path.join(process.cwd(), 'src', 'components', 'fares', 'PaymentStep.tsx'),
      'utf8'
    );
    // One money path, not two: the express button must call the same
    // function the card button does, so a wallet can never skip the
    // book-before-capture ordering.
    expect(component).toContain('ExpressCheckoutElement');
    expect(component).toContain('onConfirm');

    const handlerCalls = component.match(/authoriseThenBook\(\)/g) ?? [];
    expect(handlerCalls.length, 'both routes call authoriseThenBook').toBeGreaterThanOrEqual(2);

    // And only one place may actually CALL the confirm endpoint (prose in the
    // file header mentions it too, which is why this matches the fetch itself).
    const confirmCalls = component.match(/fetch\(\s*'\/api\/fares\/confirm'/g) ?? [];
    expect(confirmCalls.length, 'exactly one call site for the confirm route').toBe(1);
  });

  it('hides the wallet block when the device offers no wallet', async () => {
    const component = await readFile(
      path.join(process.cwd(), 'src', 'components', 'fares', 'PaymentStep.tsx'),
      'utf8'
    );
    expect(component).toContain('is-empty');
    expect(component).toContain('availablePaymentMethods');
  });
});

describe('the finish-on-another-device link', () => {
  it('is signed, so order references cannot be walked', async () => {
    const { payToken, verifyPayToken } = await import('@/lib/payLink');
    const good = payToken('EZY-123456');

    expect(verifyPayToken('EZY-123456', good)).toBe(true);
    expect(verifyPayToken('EZY-123457', good), 'a token must not work on another order').toBe(false);
    expect(verifyPayToken('EZY-123456', undefined)).toBe(false);
    expect(verifyPayToken('EZY-123456', 'not-the-token')).toBe(false);
    expect(good.length).toBe(32);
  });

  it('is refused outright by the page when the token is wrong', async () => {
    const page = await readFile(
      path.join(process.cwd(), 'src', 'app', 'book', 'pay', '[reference]', 'page.tsx'),
      'utf8'
    );
    expect(page).toContain('verifyPayToken');
    expect(page).toContain('notFound()');
  });

  it('will not reopen a payment screen for a booking already ticketed', async () => {
    const page = await readFile(
      path.join(process.cwd(), 'src', 'app', 'book', 'pay', '[reference]', 'page.tsx'),
      'utf8'
    );
    expect(page).toContain('if (order.supplierRef)');
  });
});
