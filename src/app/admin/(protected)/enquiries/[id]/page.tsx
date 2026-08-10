import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { slaState, transitionStage } from '@/lib/enquiries';
import { ALL_STAGES, STAGE_LABEL, budgetLabel, type Stage } from '@/lib/enquiryOptions';
import { formatMoney, parseMajorToMinor } from '@/lib/money';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function EnquiryDetail({ params }: { params: { id: string } }) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: params.id },
    include: {
      events: { orderBy: { createdAt: 'desc' } },
      orders: true,
    },
  });
  if (enquiry === null) notFound();

  const sla = slaState(enquiry);

  async function update(formData: FormData) {
    'use server';
    const toStage = String(formData.get('stage') ?? '') as Stage;
    const note = String(formData.get('note') ?? '').trim();
    const quotedRaw = String(formData.get('quoted') ?? '').trim();
    const lostReason = String(formData.get('lostReason') ?? '').trim();

    if (!ALL_STAGES.includes(toStage)) {
      redirect(`/admin/enquiries/${params.id}`);
    }

    await transitionStage({
      enquiryId: params.id,
      toStage,
      note: note === '' ? undefined : note,
      quotedMinor: quotedRaw === '' ? undefined : parseMajorToMinor(quotedRaw),
      lostReason: toStage === 'lost' ? (lostReason === '' ? undefined : lostReason) : undefined,
    });

    revalidatePath(`/admin/enquiries/${params.id}`);
    revalidatePath('/admin/enquiries');
    redirect(`/admin/enquiries/${params.id}`);
  }

  const waHref = enquiry.phone
    ? `https://wa.me/${enquiry.phone.replace(/[^0-9]/g, '')}`
    : `https://wa.me/${config.contact.whatsapp}`;

  return (
    <div>
      <Link href="/admin/enquiries" className="text-sm text-[#556974] no-underline">
        ← Pipeline
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{enquiry.name}</h1>
          <p className="mt-1 font-mono text-sm text-[#718793]">{enquiry.reference}</p>
          <p className="mt-1 text-sm text-[#556974]">
            {enquiry.phone && <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>}
            {enquiry.email && (
              <>
                {' · '}
                <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
              </>
            )}
          </p>
        </div>
        {sla.dueAt && (
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              sla.overdue ? 'bg-[#9c4514] text-white' : 'bg-surface text-ink'
            }`}
          >
            {sla.label}: {sla.dueAt.toLocaleString('en-GB', { timeZone: 'Europe/London' })}
            {sla.overdue ? ' — OVERDUE' : ''}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-ink">The trip</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[#718793]">Route</dt>
                <dd className="font-semibold text-ink">
                  {enquiry.origin ?? '—'} → {enquiry.destination ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[#718793]">Travellers</dt>
                <dd className="font-semibold text-ink">
                  {enquiry.paxAdults} adult{enquiry.paxAdults === 1 ? '' : 's'}
                  {enquiry.paxChildren > 0 && `, ${enquiry.paxChildren} child`}
                  {enquiry.paxInfants > 0 && `, ${enquiry.paxInfants} infant`}
                </dd>
              </div>
              <div>
                <dt className="text-[#718793]">Budget</dt>
                <dd className="font-semibold text-ink">{budgetLabel(enquiry.budgetBand)}</dd>
              </div>
              <div>
                <dt className="text-[#718793]">Type</dt>
                <dd className="font-semibold text-ink">{enquiry.tripType}</dd>
              </div>
              <div>
                <dt className="text-[#718793]">Source</dt>
                <dd className="font-semibold text-ink">{enquiry.source}</dd>
              </div>
              <div>
                <dt className="text-[#718793]">Received</dt>
                <dd className="font-semibold text-ink">
                  {enquiry.createdAt.toLocaleString('en-GB', { timeZone: 'Europe/London' })}
                </dd>
              </div>
            </dl>
            {enquiry.message && (
              <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-[#3a4b54]">
                {enquiry.message}
              </p>
            )}
          </section>

          <form action={update} className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-ink">Move it on</h2>
            <p className="mt-1 text-sm text-[#556974]">
              Every change is recorded against the enquiry.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="stage">Stage</label>
                <select id="stage" name="stage" className="input" defaultValue={enquiry.stage}>
                  {ALL_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABEL[stage]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="quoted">Quoted (£)</label>
                <input
                  id="quoted"
                  name="quoted"
                  className="input"
                  inputMode="decimal"
                  placeholder="1240.00"
                  defaultValue={
                    enquiry.quotedMinor !== null ? (enquiry.quotedMinor / 100).toFixed(2) : ''
                  }
                />
              </div>
            </div>
            <div className="field mt-4">
              <label htmlFor="note">Note</label>
              <textarea
                id="note"
                name="note"
                rows={3}
                className="input"
                placeholder="What you quoted, what they said, what to chase next."
              />
            </div>
            <div className="field mt-4">
              <label htmlFor="lostReason">If lost, why</label>
              <input
                id="lostReason"
                name="lostReason"
                className="input"
                defaultValue={enquiry.lostReason ?? ''}
                placeholder="Booked direct / went quiet / price"
              />
            </div>
            <button type="submit" className="btn btn-primary mt-4">
              Save
            </button>
          </form>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-ink">History</h2>
            <ol className="mt-3 space-y-3">
              {enquiry.events.map((event) => (
                <li key={event.id} className="border-l-2 border-line pl-3 text-sm">
                  <p className="font-semibold text-ink">
                    {event.fromStage ? `${STAGE_LABEL[event.fromStage as Stage] ?? event.fromStage} → ` : ''}
                    {STAGE_LABEL[event.toStage as Stage] ?? event.toStage}
                  </p>
                  {event.note && <p className="text-[#556974]">{event.note}</p>}
                  <p className="text-xs text-[#718793]">
                    {event.createdAt.toLocaleString('en-GB', { timeZone: 'Europe/London' })} ·{' '}
                    {event.actor ?? 'system'}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="text-base font-bold text-ink">SLA</h2>
            <dl className="mt-3 space-y-2">
              {(
                [
                  ['Quote due', enquiry.quoteDueAt],
                  ['Follow-up 1', enquiry.followUp1DueAt],
                  ['Follow-up 2', enquiry.followUp2DueAt],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-[#718793]">{label}</dt>
                  <dd className="text-ink">
                    {value
                      ? value.toLocaleString('en-GB', {
                          timeZone: 'Europe/London',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {enquiry.whatsappOptIn && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener"
              className="btn btn-secondary btn-block no-underline"
            >
              Open WhatsApp
            </a>
          )}

          <Link href={`/admin/orders/new?enquiry=${enquiry.id}`} className="btn btn-primary btn-block no-underline">
            Log an order from this
          </Link>

          {enquiry.orders.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-5 text-sm">
              <h2 className="text-base font-bold text-ink">Orders</h2>
              <ul className="mt-2 space-y-1">
                {enquiry.orders.map((order) => (
                  <li key={order.id}>
                    <Link href={`/admin/orders/${order.id}`} className="font-mono font-semibold">
                      {order.reference}
                    </Link>{' '}
                    <span className="text-[#556974]">
                      {formatMoney(order.totalMinor, order.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
