import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { prisma } from '@/lib/db';
import { documentPath } from '@/lib/orders';

/**
 * Serves a confirmation document.
 *
 * A booking reference alone is not enough — the customer's email must match
 * too, so a guessed reference reveals nothing. An admin session bypasses the
 * email check.
 */
export async function GET(request: Request, { params }: { params: { reference: string } }) {
  const reference = decodeURIComponent(params.reference);
  const email = new URL(request.url).searchParams.get('email');

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { customer: true, documents: true },
  });

  if (order === null || order.documents.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!isAdminAuthenticated()) {
    if (email === null || email.toLowerCase() !== order.customer.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Add ?email= the address this booking was made with.' },
        { status: 403 }
      );
    }
  }

  let file: Buffer;
  try {
    file = await readFile(documentPath(reference));
  } catch {
    return NextResponse.json({ error: 'Document is not available' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="eZAY-${reference}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
