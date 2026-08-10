import Link from 'next/link';
import { prisma } from '@/lib/db';
import { slaState } from '@/lib/enquiries';
import { STAGES, STAGE_LABEL, budgetLabel, type Stage } from '@/lib/enquiryOptions';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

function relative(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  const hours = Math.round(Math.abs(diffMs) / 3_600_000);
  const label = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
  return diffMs >= 0 ? `in ${label}` : `${label} overdue`;
}

/**
 * The pipeline board. Columns are the Enquiry.stage values from the schema,
 * and each card carries its SLA state so overdue work is visible without
 * opening anything.
 */
export default async function EnquiriesBoard() {
  const now = new Date();
  const enquiries = await prisma.enquiry.findMany({
    where: { stage: { not: 'lost' } },
    orderBy: { createdAt: 'asc' },
    take: 400,
  });

  const lostCount = await prisma.enquiry.count({ where: { stage: 'lost' } });
  const byStage = (stage: Stage) => enquiries.filter((e) => e.stage === stage);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Enquiries</h1>
        <p className="text-sm text-[#556974]">
          {enquiries.length} open · {lostCount} lost
        </p>
      </div>
      <p className="mt-1 text-sm text-[#556974]">
        Quote due within 4 working hours; follow-ups at day 2 and day 5. Red is overdue.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const items = byStage(stage);
          return (
            <section key={stage} className="rounded-2xl border border-line bg-white p-3">
              <h2 className="flex items-baseline justify-between px-1 pb-2 text-sm font-bold text-ink">
                {STAGE_LABEL[stage]}
                <span className="text-xs font-semibold text-[#718793]">{items.length}</span>
              </h2>

              {items.length === 0 && (
                <p className="px-1 py-3 text-xs text-[#718793]">Nothing here.</p>
              )}

              <ul className="space-y-2">
                {items.map((enquiry) => {
                  const sla = slaState(enquiry, now);
                  return (
                    <li
                      key={enquiry.id}
                      className={`rounded-xl border p-3 ${
                        sla.overdue ? 'border-[#9c4514] bg-[#fff2e9]' : 'border-line bg-sky'
                      }`}
                    >
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="font-semibold text-ink no-underline hover:underline"
                      >
                        {enquiry.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-[#718793]">
                        {enquiry.reference}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#556974]">
                        {enquiry.destination
                          ? `${enquiry.origin ?? '—'} → ${enquiry.destination}`
                          : (enquiry.message ?? 'No detail given')}
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#718793]">
                        {budgetLabel(enquiry.budgetBand)}
                        {enquiry.quotedMinor !== null && (
                          <> · quoted {formatMoney(enquiry.quotedMinor)}</>
                        )}
                      </p>
                      {sla.dueAt && (
                        <p
                          className={`mt-1.5 text-[11px] font-bold ${
                            sla.overdue ? 'text-[#9c4514]' : 'text-[#556974]'
                          }`}
                        >
                          {sla.label} {relative(sla.dueAt, now)}
                        </p>
                      )}
                      {enquiry.whatsappOptIn && (
                        <span className="mt-1.5 inline-block rounded bg-[#e6f6f4] px-1.5 py-0.5 text-[10px] font-semibold text-[#123d39]">
                          WhatsApp OK
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
