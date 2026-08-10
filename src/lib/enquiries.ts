import 'server-only';
import { z } from 'zod';
import { config } from './config';
import { prisma } from './db';
import { sendEmail } from './email';
import { generateEnquiryReference } from './references';
import { BUDGET_BANDS as BANDS, TRIP_TYPES as TRIP_TYPE_VALUES } from './enquiryOptions';
import type { Stage } from './enquiryOptions';
import { enquiryDeadlines } from './workingHours';

/**
 * The enquiry pipeline. This is the primary revenue channel at launch, not a
 * fallback — travel enquiries convert on the third or fourth contact, so the
 * stages and their SLA timers are the business, not admin decoration.
 *
 * Stage values mirror the strings in prisma/schema.prisma.
 */

// Option lists live in enquiryOptions.ts so the client components can import
// them too — this module is server-only.
export {
  STAGES,
  STAGE_LABEL,
  TRIP_TYPES,
  BUDGET_BANDS,
  ALL_STAGES,
  budgetLabel,
} from './enquiryOptions';
export type { Stage, TripType } from './enquiryOptions';

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name.').max(120),
  // The design's form asks for a mobile, not an email — email is optional so
  // the public form is not made harder than the approved design.
  email: z.string().trim().email('That email address does not look right.').optional().or(z.literal('')),
  phone: z.string().trim().min(6, 'We need a number to reply on.').max(40),
  whatsappOptIn: z.boolean().default(true),
  tripType: z.enum(TRIP_TYPE_VALUES).default('flight'),
  message: z.string().trim().max(4000).optional(),
  budgetBand: z.string().trim().max(40).optional(),
  origin: z.string().trim().max(120).optional(),
  destination: z.string().trim().max(120).optional(),
  paxAdults: z.number().int().min(1).max(20).default(1),
  paxChildren: z.number().int().min(0).max(20).default(0),
  paxInfants: z.number().int().min(0).max(20).default(0),
  source: z.string().trim().max(40).default('website'),
  /** Honeypot — must be empty. Bots fill it, people never see it. */
  website: z.string().max(0).optional().or(z.literal('')),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/**
 * Creates the enquiry, stamps its three SLA deadlines, and records the
 * opening event. Notification failure never loses the enquiry — it is
 * committed before we try to email anyone.
 */
export async function createEnquiry(input: EnquiryInput) {
  const createdAt = new Date();
  const deadlines = enquiryDeadlines(createdAt);
  const reference = generateEnquiryReference();

  const enquiry = await prisma.enquiry.create({
    data: {
      reference,
      name: input.name,
      email: input.email && input.email !== '' ? input.email : '',
      phone: input.phone,
      whatsappOptIn: input.whatsappOptIn,
      tripType: input.tripType,
      origin: input.origin,
      destination: input.destination,
      paxAdults: input.paxAdults,
      paxChildren: input.paxChildren,
      paxInfants: input.paxInfants,
      budgetBand: input.budgetBand,
      message: input.message,
      source: input.source,
      stage: 'enquiry',
      quoteDueAt: deadlines.quoteDueAt,
      followUp1DueAt: deadlines.followUp1DueAt,
      followUp2DueAt: deadlines.followUp2DueAt,
      createdAt,
      events: {
        create: {
          toStage: 'enquiry',
          note: `Enquiry received via ${input.source}`,
          actor: 'system',
        },
      },
    },
  });

  try {
    await sendEmail({
      to: config.email.notifyEmail,
      subject: `New enquiry ${enquiry.reference} — ${enquiry.name}`,
      html: enquiryNotificationHtml(enquiry),
    });
  } catch (error) {
    console.error(`Enquiry ${enquiry.reference} saved, notification failed:`, error);
  }

  return enquiry;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function enquiryNotificationHtml(enquiry: {
  reference: string;
  name: string;
  phone: string | null;
  email: string;
  whatsappOptIn: boolean;
  budgetBand: string | null;
  message: string | null;
  source: string;
  quoteDueAt: Date | null;
  id: string;
}): string {
  const band = BANDS.find((b) => b.value === enquiry.budgetBand)?.label ?? enquiry.budgetBand ?? '—';
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">
      <h1 style="font-size:18px;margin:0 0 12px">New enquiry ${escapeHtml(enquiry.reference)}</h1>
      <p style="margin:0 0 6px"><strong>${escapeHtml(enquiry.name)}</strong></p>
      <p style="margin:0 0 6px">${escapeHtml(enquiry.phone ?? '')}${enquiry.email ? ` · ${escapeHtml(enquiry.email)}` : ''}</p>
      <p style="margin:0 0 6px">WhatsApp: ${enquiry.whatsappOptIn ? 'yes' : 'no'} · Budget: ${escapeHtml(band)} · Source: ${escapeHtml(enquiry.source)}</p>
      <hr>
      <p style="white-space:pre-wrap">${escapeHtml(enquiry.message ?? '(no detail given)')}</p>
      <p style="margin-top:16px"><strong>Quote due by ${enquiry.quoteDueAt?.toLocaleString('en-GB', { timeZone: 'Europe/London' }) ?? 'soon'}</strong> (4 working hours)</p>
      <p><a href="${config.siteUrl}/admin/enquiries/${enquiry.id}">Open in admin</a></p>
    </div>
  `;
}

/**
 * Moves an enquiry to a new stage, writing an EnquiryEvent for the audit
 * trail. Every stage change goes through here — that is what makes the CRM
 * history trustworthy.
 */
export async function transitionStage(params: {
  enquiryId: string;
  toStage: Stage;
  note?: string;
  actor?: string;
  quotedMinor?: number | null;
  lostReason?: string | null;
}) {
  const current = await prisma.enquiry.findUniqueOrThrow({
    where: { id: params.enquiryId },
    select: { stage: true },
  });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.enquiry.update({
      where: { id: params.enquiryId },
      data: {
        stage: params.toStage,
        ...(params.quotedMinor !== undefined ? { quotedMinor: params.quotedMinor } : {}),
        ...(params.lostReason !== undefined ? { lostReason: params.lostReason } : {}),
      },
    });

    await tx.enquiryEvent.create({
      data: {
        enquiryId: params.enquiryId,
        fromStage: current.stage,
        toStage: params.toStage,
        note: params.note,
        actor: params.actor ?? 'admin',
      },
    });

    return updated;
  });
}

export interface SlaState {
  label: string;
  dueAt: Date | null;
  overdue: boolean;
}

/**
 * What is due next on an enquiry and whether it is late. Reads the deadlines
 * stamped at creation rather than recomputing, so the clock does not move
 * when config changes.
 */
export function slaState(
  enquiry: {
    stage: string;
    quoteDueAt: Date | null;
    followUp1DueAt: Date | null;
    followUp2DueAt: Date | null;
  },
  now: Date = new Date()
): SlaState {
  const due = (label: string, dueAt: Date | null): SlaState => ({
    label,
    dueAt,
    overdue: dueAt !== null && now > dueAt,
  });

  switch (enquiry.stage) {
    case 'enquiry':
      return due('Quote due', enquiry.quoteDueAt);
    case 'quoted':
      return due('Follow-up 1 due', enquiry.followUp1DueAt);
    case 'follow_up_1':
      return due('Follow-up 2 due', enquiry.followUp2DueAt);
    case 'follow_up_2':
      return { label: 'Awaiting decision', dueAt: null, overdue: false };
    case 'booked':
      return { label: 'Booked', dueAt: null, overdue: false };
    case 'travelled':
      return { label: 'Ask for a review', dueAt: null, overdue: false };
    case 'review_requested':
      return { label: 'Complete', dueAt: null, overdue: false };
    default:
      return { label: 'Closed', dueAt: null, overdue: false };
  }
}
