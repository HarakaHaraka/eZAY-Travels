import Link from 'next/link';
import { accreditationClaim } from '@/lib/accreditation';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { slaState } from '@/lib/enquiries';
import { formatMoney } from '@/lib/money';
import { attachRevenueMinor } from '@/lib/orders';
import { requiresRemittance } from '@/lib/payments';

export const dynamic = 'force-dynamic';

function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'alert' | 'good';
}) {
  const toneClass =
    tone === 'alert' ? 'text-[#9c4514]' : tone === 'good' ? 'text-[#1a5852]' : 'text-ink';
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-[#556974]">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-[#718793]">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [enquiriesThisWeek, allEnquiries, openEnquiries, confirmedOrders, attentionOrders, remittance] =
    await Promise.all([
      prisma.enquiry.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.enquiry.count(),
      prisma.enquiry.findMany({
        where: { stage: { in: ['enquiry', 'quoted', 'follow_up_1'] } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.findMany({
        where: { status: { in: ['confirmed', 'ticketed', 'travelled'] } },
        include: { items: true },
      }),
      prisma.order.count({ where: { status: 'requires_attention' } }),
      prisma.remittance.aggregate({
        where: { remitted: false },
        _sum: { amountMinor: true },
        _count: true,
      }),
    ]);

  const bookedEnquiries = await prisma.enquiry.count({
    where: { stage: { in: ['booked', 'travelled', 'review_requested'] } },
  });

  const marginBankedMinor = confirmedOrders.reduce((total, order) => total + order.markupMinor, 0);
  const ordersWithAttach = confirmedOrders.filter((order) =>
    order.items.some((item) => item.itemType !== 'flight' && item.itemType !== 'fee')
  ).length;
  const attachRate =
    confirmedOrders.length === 0
      ? 0
      : Math.round((ordersWithAttach / confirmedOrders.length) * 100);
  const attachRevenue = confirmedOrders.reduce(
    (total, order) => total + attachRevenueMinor(order.items),
    0
  );
  const conversionRate =
    allEnquiries === 0 ? 0 : Math.round((bookedEnquiries / allEnquiries) * 100);

  const overdue = openEnquiries.filter((enquiry) => slaState(enquiry, now).overdue);
  const claim = accreditationClaim();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

      {claim === null && (
        <div className="mt-5 rounded-2xl border-2 border-[#9c4514] bg-[#fff2e9] p-5">
          <h2 className="font-bold text-[#9c4514]">
            Accreditation not configured — flights are not sellable
          </h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[#556974]">
            ATOL_HOLDER_NAME and ATOL_NUMBER are blank, so the site renders no protection claim and
            flight checkout is disabled. The enquiry form still works and is presented to customers
            as the way to book. Hotel-only sales are unaffected — they do not require ATOL.
          </p>
        </div>
      )}

      {attentionOrders > 0 && (
        <div className="mt-5 rounded-2xl border-2 border-[#9c4514] bg-[#fff2e9] p-5">
          <h2 className="font-bold text-[#9c4514]">
            {attentionOrders} order{attentionOrders > 1 ? 's' : ''}{' '}
            {attentionOrders > 1 ? 'need' : 'needs'} attention
          </h2>
          <p className="mt-1.5 text-sm text-[#556974]">
            Payment landed but the confirmation did not go out. These are not confirmed to the
            customer.
          </p>
          <Link
            href="/admin/orders?status=requires_attention"
            className="mt-3 inline-block font-semibold text-[#9c4514]"
          >
            Open them →
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Enquiries this week"
          value={String(enquiriesThisWeek)}
          hint={`${allEnquiries} all time`}
        />
        <Stat
          label="Overdue right now"
          value={String(overdue.length)}
          hint="Past their SLA"
          tone={overdue.length > 0 ? 'alert' : 'good'}
        />
        <Stat
          label="Conversion rate"
          value={`${conversionRate}%`}
          hint={`${bookedEnquiries} of ${allEnquiries} booked`}
        />
        <Stat
          label="Attach rate"
          value={`${attachRate}%`}
          hint={`${ordersWithAttach} of ${confirmedOrders.length} orders`}
          tone={attachRate >= 50 ? 'good' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Margin banked"
          value={formatMoney(marginBankedMinor)}
          hint="Markup on confirmed orders"
          tone="good"
        />
        <Stat
          label="Of which attach"
          value={formatMoney(attachRevenue)}
          hint="Hotels, transfers, insurance and ancillaries"
        />
        {requiresRemittance() && (
          <Stat
            label="Owed onward"
            value={formatMoney(remittance._sum.amountMinor ?? 0)}
            hint={`${remittance._count} unremitted`}
            tone={remittance._count > 0 ? 'alert' : 'good'}
          />
        )}
      </div>

      {overdue.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">Chase these first</h2>
          <p className="mt-1 text-sm text-[#556974]">
            Travel enquiries convert on the third or fourth contact. Overdue is lost revenue.
          </p>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {overdue.slice(0, 10).map((enquiry) => {
              const sla = slaState(enquiry, now);
              return (
                <li key={enquiry.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Link
                    href={`/admin/enquiries/${enquiry.id}`}
                    className="font-semibold text-ink no-underline hover:underline"
                  >
                    {enquiry.name}
                  </Link>
                  <span className="font-mono text-xs text-[#718793]">{enquiry.reference}</span>
                  <span className="text-sm text-[#556974]">{enquiry.phone}</span>
                  <span className="ml-auto text-sm font-bold text-[#9c4514]">
                    {sla.label} — overdue
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-[#718793]">
        Payment mode: <strong>{config.payments.mode}</strong> · Duffel:{' '}
        <strong>{config.duffel.demoMode ? 'not configured (fixtures)' : 'configured'}</strong> ·
        Email: <strong>{config.email.transport}</strong>
      </p>
    </div>
  );
}
