/**
 * Enquiry option lists and stage labels.
 *
 * Deliberately free of `server-only` and of any Prisma import: the public
 * enquiry form and the admin CRM are client components and need these too.
 * Values mirror the comments in prisma/schema.prisma.
 */

export const STAGES = [
  'enquiry',
  'quoted',
  'follow_up_1',
  'follow_up_2',
  'booked',
  'travelled',
  'review_requested',
] as const;

export type Stage = (typeof STAGES)[number] | 'lost';

export const ALL_STAGES: Stage[] = [...STAGES, 'lost'];

export const STAGE_LABEL: Record<Stage, string> = {
  enquiry: 'Enquiry',
  quoted: 'Quoted',
  follow_up_1: 'Follow-up 1',
  follow_up_2: 'Follow-up 2',
  booked: 'Booked',
  travelled: 'Travelled',
  review_requested: 'Review requested',
  lost: 'Lost',
};

export const TRIP_TYPES = ['flight', 'flight_hotel', 'group', 'transfer', 'other'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const TRIP_TYPE_LABEL: Record<TripType, string> = {
  flight: 'Flight only',
  flight_hotel: 'Flight + hotel',
  group: 'Group',
  transfer: 'Transfer',
  other: 'Something else',
};

export const BUDGET_BANDS = [
  { value: 'under_500', label: 'Under £500' },
  { value: '500_800', label: '£500–£800' },
  { value: '800_plus', label: '£800+' },
] as const;

export function budgetLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return BUDGET_BANDS.find((b) => b.value === value)?.label ?? value;
}

export const ENQUIRY_SOURCES = [
  'website',
  'whatsapp',
  'phone',
  'instagram',
  'tiktok',
  'referral',
  'partner',
] as const;
