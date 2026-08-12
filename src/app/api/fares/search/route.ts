import { NextResponse } from 'next/server';
import { z } from 'zod';
import { flightGateway } from '@/lib/duffel';
import { priceOffer } from '@/lib/offers';
import { recordSearch } from '@/lib/searchLog';

const searchSchema = z.object({
  origin: z.string().trim().min(3),
  destination: z.string().trim().min(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengerCount: z.coerce.number().int().min(1).max(9),
});

/** Extracts a 3-letter IATA code from "Lagos LOS" or "LOS". */
function iata(value: string): string {
  const match = value.trim().toUpperCase().match(/[A-Z]{3}(?!.*[A-Z]{3})/);
  return match ? match[0] : value.trim().toUpperCase().slice(0, 3);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check your search — we need two airports and a departure date.' },
      { status: 400 }
    );
  }

  recordSearch();

  try {
    const raw = await flightGateway().searchOffers({
      origin: iata(parsed.data.origin),
      destination: iata(parsed.data.destination),
      departureDate: parsed.data.departureDate,
      returnDate: parsed.data.returnDate,
      passengerCount: parsed.data.passengerCount,
    });
    return NextResponse.json({ offers: raw.map(priceOffer) });
  } catch (error) {
    console.error('Fare search failed:', error);
    // Never an error page — the enquiry form and the phone number are the
    // fallback, per the brief.
    return NextResponse.json(
      { error: 'We could not reach the fare system just now. Send us an enquiry and we will price it by hand.' },
      { status: 502 }
    );
  }
}
