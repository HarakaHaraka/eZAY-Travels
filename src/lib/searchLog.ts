import 'server-only';

/**
 * Per-day search counter. Duffel charges for excess searches and a
 * content-led site gets browsers before bookers, so we log how many searches
 * a day runs. Held on globalThis (in-process) — for a single deployment this
 * is the right amount of machinery; behind several instances it wants a
 * shared store, noted in the README.
 */
const globalForLog = globalThis as unknown as {
  __ezaySearchLog?: Map<string, number>;
};
const log: Map<string, number> = (globalForLog.__ezaySearchLog ??= new Map());

export function recordSearch(): number {
  const day = new Date().toISOString().slice(0, 10);
  const next = (log.get(day) ?? 0) + 1;
  log.set(day, next);
  return next;
}

export function searchesToday(): number {
  return log.get(new Date().toISOString().slice(0, 10)) ?? 0;
}
