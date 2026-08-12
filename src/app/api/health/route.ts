import { NextResponse } from 'next/server';

/**
 * Lightweight liveness endpoint for an uptime pinger (e.g. cron-job.org) to
 * keep the free Render instance from sleeping. It deliberately does NOT touch
 * the database, so a keep-alive ping every few minutes costs effectively
 * nothing — unlike pinging the homepage, which runs a full query each hit.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ezay-travels',
    time: new Date().toISOString(),
  });
}
