import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { requiresRemittance } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export default async function RemittancesPage() {
  // Only meaningful in collect_and_remit mode.
  if (!requiresRemittance()) notFound();

  const remittances = await prisma.remittance.findMany({
    include: { order: { include: { customer: true } } },
    orderBy: [{ remitted: 'asc' }, { dueAt: 'asc' }],
  });

  const outstanding = remittances.filter((r) => !r.remitted);
  const outstandingTotal = outstanding.reduce((total, r) => total + r.amountMinor, 0);
  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Remittances</h1>
      <p className="mt-1 max-w-prose text-[#556974]">
        Money collected from customers that is owed onward. The transfer itself is made by hand —
        this list tells you what and when.
      </p>

      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        <p className="text-sm font-semibold text-[#556974]">Outstanding</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[#9c4514]">
          {formatMoney(outstandingTotal)}
        </p>
        <p className="mt-1 text-sm text-[#718793]">
          across {outstanding.length} order{outstanding.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="table min-w-[760px]">
          <caption className="sr-only">Remittances owed onward</caption>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Reference</th>
              <th scope="col" className="text-right">Amount</th>
              <th scope="col">Due</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {remittances.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#718793]">
                  Nothing owed onward yet.
                </td>
              </tr>
            )}
            {remittances.map((remittance) => {
              const overdue = !remittance.remitted && remittance.dueAt < now;
              return (
                <tr key={remittance.id}>
                  <td>
                    <Link
                      href={`/admin/orders/${remittance.orderId}`}
                      className="font-mono font-semibold"
                    >
                      {remittance.order.reference}
                    </Link>
                  </td>
                  <td className="text-[#556974]">{remittance.order.customer.name}</td>
                  <td className="font-mono text-[#718793]">{remittance.reference ?? '—'}</td>
                  <td className="text-right tabular-nums">
                    {formatMoney(remittance.amountMinor, remittance.order.currency)}
                  </td>
                  <td className={overdue ? 'font-bold text-[#9c4514]' : 'text-[#556974]'}>
                    {remittance.dueAt.toLocaleDateString('en-GB')}
                    {overdue && ' — overdue'}
                  </td>
                  <td>
                    {remittance.remitted ? (
                      <span className="rounded-full bg-[#e6f6f4] px-2.5 py-1 text-xs font-semibold text-[#123d39]">
                        Remitted
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                        Outstanding
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
