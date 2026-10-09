/**
 * Bumped by hand whenever something visible ships.
 *
 * /status prints this, so a stale deployment is obvious at a glance: if the
 * marker on the live site is not the one in this file on main, the service has
 * not built the latest commit.
 *
 * It lives here rather than in the page because a Next.js App Router page may
 * only export a known set of fields (default, metadata, dynamic, revalidate
 * and friends); any other export fails the production build.
 */
export const BUILD_MARKER = '2026-10-09-fee20-checkout-on';
