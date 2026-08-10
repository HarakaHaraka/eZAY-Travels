import { NextResponse } from 'next/server';
import { createEnquiry, enquirySchema } from '@/lib/enquiries';
import { clientKey, rateLimit } from '@/lib/rateLimit';

/** 5 enquiries per IP per 10 minutes is generous for a person, useless for a bot. */
const LIMIT = 5;
const WINDOW_SECONDS = 600;

export async function POST(request: Request) {
  const limited = rateLimit(`enquiry:${clientKey(request)}`, LIMIT, WINDOW_SECONDS);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'That is a lot of enquiries in a short time. Give it a few minutes, or WhatsApp us.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' },
      { status: 400 }
    );
  }

  // Honeypot: a filled hidden field means a bot. Answer 201 so it learns
  // nothing, but save nothing.
  if (parsed.data.website && parsed.data.website !== '') {
    return NextResponse.json({ reference: 'ENQ-000000' }, { status: 201 });
  }

  try {
    const enquiry = await createEnquiry(parsed.data);
    return NextResponse.json({ reference: enquiry.reference, id: enquiry.id }, { status: 201 });
  } catch (error) {
    console.error('Enquiry creation failed:', error);
    return NextResponse.json(
      { error: 'We could not save that just now. Please WhatsApp us instead and we will pick it up.' },
      { status: 500 }
    );
  }
}
