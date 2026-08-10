import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { attachRevenueMinor } from '@/lib/orders';

export const dynamic = 'force-dynamic';

const STATUSES = [
  'pending',
  'confirmed',
  'ticketed',
  'travelled',
  'requires_attention',
  'cancelled',
  'refunded',
] as const;

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-surface text-ink',
  confirmed: 'bg-[#e6f6f4] text-[#123d39]',
  ticketed: 'bg-[#e6f6f4] text-[#123d39]',
  travelled: 'bg-[#e6f6f4] text-[#123d39]',
  requires_attention: 'bg-[#9c4514] text-white',
  cancelled: 'bg-surface text-[#718793]',
  refunded: 'bg-surface text-[#718793]',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string };
}) {
  const status = STATUSES.find((s) => s === searchParams.status);
  const orderType = ['api', 'manual'].includes(searchParams.type ?? '')
    ? searchParams.type
    : undefined;

  const orders = await prisma.order.findMany({
    where: { ...(status ? { status } : {}), ...(orderType ? { orderType } : {}) },
    include: { items: true, customer: true, documents: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <Link href="/admin/orders/new" className="btn btn-primary no-underline">
          Log manual order
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold no-underline ${
            !status && !orderType ? 'border-ink bg-ink text-white' : 'border-line bg-white text-[#556974]'
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold no-underline ${
              status === s ? 'border-ink bg-ink text-white' : 'border-line bg-white text-[#556974]'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
        <Link
          href="/admin/orders?type=manual"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold no-underline ${
            orderType === 'manual' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-[#556974]'
          }`}
        >
          Manual only
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="table min-w-[920px]">
          <caption className="sr-only">All orders with margin</caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Customer</th>
              <th scope="col">Source</th>
              <th scope="col" className="text-right">Cost</th>
              <th scope="col" className="text-right">Sale</th>
              <th scope="col" className="text-right">Margin</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#718793]">
                  No orders here yet.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const attach = attachRevenueMinor(order.items);
              return (
                <tr key={order.id}>
                  <td className="align-top">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono font-semibold">
                      {order.reference}
                    </Link>
                    <span className="mt-0.5 block text-xs text-[#718793]">
                      {order.createdAt.toLocaleDateString('en-GB')}
                    </span>
                  </td>
                  <td className="align-top">
                    {order.customer.name}
                    <span className="block text-xs text-[#718793]">{order.customer.email}</span>
                  </td>
                  <td className="align-top">
                    <span className="rounded bg-surface px-1.5 py-0.5 text-xs font-semibold">
                      {order.orderType === 'manual' ? order.supplier : 'duffel'}
                    </span>
                    {attach > 0 && (
                      <span className="mt-1 block text-xs text-[#1a5852]">
                        +{formatMoney(attach)} attach
                      </span>
                    )}
                  </td>
                  <td className="text-right align-top tabular-nums text-[#556974]">
                    {formatMoney(order.costMinor, order.currency)}
                  </td>
                  <td className="text-right align-top tabular-nums">
                    {formatMoney(order.totalMinor, order.currency)}
                  </td>
                  <td className="text-right align-top font-bold tabular-nums text-[#1a5852]">
                    {formatMoney(order.markupMinor, order.currency)}
                  </td>
                  <td className="align-top">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[order.status] ?? 'bg-surface'}`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
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
