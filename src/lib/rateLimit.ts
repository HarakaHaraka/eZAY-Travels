/**
 * Minimal in-process rate limiter for the public enquiry endpoint.
 *
 * Held on globalThis so it survives Next's module reloading in development.
 * In-process means it does not span instances — for a single deployment that
 * is the right amount of machinery; behind several instances this wants
 * moving to Redis, and that is noted in the README rather than pretended away.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForLimiter = globalThis as unknown as {
  __ezayRateBuckets?: Map<string, Bucket>;
};
const buckets: Map<string, Bucket> = (globalForLimiter.__ezayRateBuckets ??= new Map());

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (existing === undefined || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Best-effort client identity from proxy headers. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
