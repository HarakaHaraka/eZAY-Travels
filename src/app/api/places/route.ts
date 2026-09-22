import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { searchAirports, type AirportEntry } from '@/lib/airports';

/**
 * Airport/city suggestions for the fare-bar autocomplete.
 *
 * GET /api/places?query=lon
 *
 * Demo mode (no DUFFEL_API_KEY): answers from the built-in directory, so the
 * dropdown works before any key is configured. With a key: asks Duffel's
 * suggestions endpoint and backs it up with the local directory. Every entry
 * is validated to carry a real 3-letter IATA code — free text can never come
 * back out of this route.
 */

interface Place {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  metro: boolean;
}

const IATA = /^[A-Z]{3}$/;

function fromEntry(a: AirportEntry): Place {
  return { code: a.code, name: a.name, city: a.city, country: a.country, metro: !!a.metro };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') ?? '').trim();

  if (query.length < 2) {
    return NextResponse.json({ places: [] });
  }

  const local = searchAirports(query).map(fromEntry);

  if (config.duffel.demoMode) {
    return NextResponse.json({ places: local });
  }

  try {
    const url = new URL('https://api.duffel.com/places/suggestions');
    url.searchParams.set('query', query);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'Duffel-Version': 'v2',
        Authorization: `Bearer ${config.duffel.apiKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Duffel unhappy — the local directory still gives a useful dropdown.
      return NextResponse.json({ places: local });
    }

    const data = await res.json();
    const raw: unknown[] = Array.isArray(data?.data) ? data.data : [];

    const remote: Place[] = raw
      .map((p) => p as Record<string, unknown>)
      .filter(
        (p) =>
          typeof p.iata_code === 'string' &&
          IATA.test(p.iata_code) &&
          typeof p.name === 'string' &&
          (p.name as string).length > 0,
      )
      .map((p) => ({
        code: p.iata_code as string,
        name: p.name as string,
        city:
          typeof p.city_name === 'string'
            ? p.city_name
            : ((p.city as Record<string, unknown> | undefined)?.name as string | undefined) ?? null,
        country: null,
        metro: p.type === 'city',
      }));

    // Merge, remote first, local filling gaps; dedupe by code; cap at 8.
    const seen = new Set<string>();
    const merged = [...remote, ...local].filter((p) => {
      if (seen.has(p.code)) return false;
      seen.add(p.code);
      return true;
    });

    return NextResponse.json({ places: merged.slice(0, 8) });
  } catch (error) {
    console.error('places route error:', error);
    return NextResponse.json({ places: local });
  }
}
