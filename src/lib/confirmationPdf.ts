import 'server-only';
import PDFDocument from 'pdfkit';
import { formatMoney } from './money';

export interface PdfSegment {
  marketingCarrier: string | null;
  flightNumber: string | null;
  originIata: string;
  destinationIata: string;
  departsAt: Date;
  arrivesAt: Date;
}

export interface PdfItem {
  description: string;
  qty: number;
  priceMinor: number;
}

export interface ConfirmationPdfInput {
  reference: string;
  issuedAt: Date;
  passengerNames: string[];
  segments: PdfSegment[];
  items: PdfItem[];
  totalMinor: number;
  currency: string;
  /**
   * Frozen on the Order at the time of sale. Null means the sale was made
   * with no accreditation configured — in which case the document carries no
   * protection claim at all, which is the correct and safe output.
   */
  protectionHolder: string | null;
  protectionNumber: string | null;
  protectionStatement: string | null;
}

function dateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(value);
}

/**
 * Renders the customer's confirmation document.
 *
 * Protection wording comes from the values frozen on the order, never from
 * current config — so a later config change cannot rewrite what a past
 * customer was told. When those values are null the document simply carries
 * no protection section.
 */
export function renderConfirmationPdf(input: ConfirmationPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(26).fillColor('#16262d').text('eZAY');
    doc.fontSize(10).fillColor('#556974').text('Travels and Tours Ltd · London');
    doc.moveDown(1.4);

    doc.fontSize(18).fillColor('#16262d').text('Booking confirmation');
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#16262d');
    doc.text(`Booking reference: ${input.reference}`);
    doc.text(`Issued: ${dateTime(input.issuedAt)}`);
    doc.moveDown(1);

    doc.fontSize(13).fillColor('#16262d').text('Passengers');
    doc.fontSize(11).fillColor('#3a4b54');
    for (const name of input.passengerNames) doc.text(`• ${name}`);
    doc.moveDown(1);

    if (input.segments.length > 0) {
      doc.fontSize(13).fillColor('#16262d').text('Itinerary');
      doc.fontSize(11).fillColor('#3a4b54');
      for (const segment of input.segments) {
        const flight = [segment.marketingCarrier, segment.flightNumber].filter(Boolean).join('');
        doc.text(`${flight}  ${segment.originIata} → ${segment.destinationIata}`);
        doc.text(`    Departs ${dateTime(segment.departsAt)}`);
        doc.text(`    Arrives ${dateTime(segment.arrivesAt)}`);
        doc.moveDown(0.3);
      }
      doc.moveDown(0.6);
    }

    doc.fontSize(13).fillColor('#16262d').text('What you paid for');
    doc.fontSize(11).fillColor('#3a4b54');
    for (const item of input.items) {
      const qty = item.qty > 1 ? ` ×${item.qty}` : '';
      doc.text(`${item.description}${qty}    ${formatMoney(item.priceMinor, input.currency)}`);
    }
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor('#16262d')
      .text(`Total paid: ${formatMoney(input.totalMinor, input.currency)}`);
    doc.moveDown(1.4);

    // Protection wording — only from the frozen values, only when present.
    if (input.protectionHolder !== null && input.protectionNumber !== null) {
      doc.fontSize(13).fillColor('#16262d').text('Financial protection');
      doc.fontSize(10).fillColor('#3a4b54');
      doc.text(`Accreditation holder: ${input.protectionHolder}`);
      doc.text(`Licence number: ${input.protectionNumber}`);
      if (input.protectionStatement) {
        doc.moveDown(0.4);
        doc.text(input.protectionStatement);
      }
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor('#718793')
      .text('eZAY Travels and Tours Ltd · Registered in England and Wales', { align: 'center' });

    doc.end();
  });
}
