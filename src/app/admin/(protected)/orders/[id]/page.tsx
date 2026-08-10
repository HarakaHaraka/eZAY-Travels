import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { attachRevenueMinor, issueConfirmation } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { segments: { orderBy: { leg: 'asc' } } }, orderBy: { createdAt: 'asc' } },
      passengers: true,
      payments: true,
      documents: { orderBy: { issuedAt: 'desc' } },
      remittance: true,
      customer: true,
      enquiry: true,
    },
  });
  if (order === null) notFound();

  const attach = attachRevenueMinor(order.items);
  const flightMargin = order.markupMinor - attach;
  const marginPct =
    order.totalMinor === 0 ? 0 : Math.round((order.markupMinor / order.totalMinor) * 1000) / 10;

  // The invariant, checked rather than assumed: the stored total must equal
  // the sum of the lines. A mismatch is a bug and should be visible here.
  const summed = order.items.reduce((total, item) => total + item.priceMinor * item.qty, 0);
  const totalsAgree = summed === order.totalMinor;

  async function reissue() {
    'use server';
    await issueConfirmation(params.id, `manual-retry:${params.id}:${Date.now()}`);
    revalidatePath(`/admin/orders/${params.id}`);
    redirect(`/admin/orders/${params.id}`);
  }

  async function markRemitted() {
    'use server';
    await prisma.remittance.update({
      where: { orderId: params.id },
      data: { remitted: true, remittedAt: new Date() },
    });
    revalidatePath(`/admin/orders/${params.id}`);
    redirect(`/admin/orders/${params.id}`);
  }

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-[#556974] no-underline">
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-ink">{order.reference}</h1>
          <p className="mt-1 text-sm text-[#556974]">
            {order.orderType === 'manual' ? `Manual — ${order.supplier}` : 'Duffel API'}
            {order.supplierRef && ` · ${order.supplierRef}`} ·{' '}
            {order.createdAt.toLocaleString('en-GB', { timeZone: 'Europe/London' })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-bold ${
            order.status === 'requires_attention'
              ? 'bg-[#9c4514] text-white'
              : order.status === 'confirmed'
                ? 'bg-[#e6f6f4] text-[#123d39]'
                : 'bg-surface text-ink'
          }`}
        >
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {order.status === 'requires_attention' && (
        <div className="mt-5 rounded-2xl border-2 border-[#9c4514] bg-[#fff2e9] p-5">
          <h2 className="font-bold text-[#9c4514]">This order is NOT confirmed to the customer</h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[#556974]">
            Payment was taken but the confirmation document could not be issued or delivered. Fix
            the cause, then re-issue — the customer has had nothing.
          </p>
          <form action={reissue}>
            <button type="submit" className="btn btn-primary mt-4">
              Re-issue confirmation
            </button>
          </form>
        </div>
      )}

      {!totalsAgree && (
        <div className="mt-5 rounded-2xl border-2 border-[#9c4514] bg-[#fff2e9] p-5">
          <h2 className="font-bold text-[#9c4514]">Totals do not reconcile</h2>
          <p className="mt-1.5 text-sm text-[#556974]">
            Stored total {formatMoney(order.totalMinor, order.currency)} but the lines sum to{' '}
            {formatMoney(summed, order.currency)}. This should be impossible — please report it.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-ink">Margin</h2>
            <table className="table mt-3">
              <tbody>
                <tr>
                  <td className="text-[#556974]">Cost to us</td>
                  <td className="text-right tabular-nums">
                    {formatMoney(order.costMinor, order.currency)}
                  </td>
                </tr>
                <tr>
                  <td className="text-[#556974]">Sale price</td>
                  <td className="text-right tabular-nums">
                    {formatMoney(order.totalMinor, order.currency)}
                  </td>
                </tr>
                <tr>
                  <td className="text-[#556974]">Flight markup</td>
                  <td className="text-right tabular-nums">
                    {formatMoney(flightMargin, order.currency)}
                  </td>
                </tr>
                <tr>
                  <td className="text-[#556974]">Attach revenue</td>
                  <td className="text-right tabular-nums">{formatMoney(attach, order.currency)}</td>
                </tr>
                <tr>
                  <td className="font-bold text-ink">Total margin</td>
                  <td className="text-right text-lg font-bold tabular-nums text-[#1a5852]">
                    {formatMoney(order.markupMinor, order.currency)}{' '}
                    <span className="text-sm font-semibold text-[#718793]">({marginPct}%)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-ink">Lines</h2>
            <table className="table mt-3">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" className="text-right">Cost</th>
                  <th scope="col" className="text-right">Markup</th>
                  <th scope="col" className="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="rounded bg-surface px-1.5 py-0.5 text-xs font-semibold">
                        {item.itemType}
                      </span>{' '}
                      {item.description}
                      {item.qty > 1 && <span className="text-[#718793]"> ×{item.qty}</span>}
                      {item.segments.length > 0 && (
                        <span className="mt-1 block text-xs text-[#718793]">
                          {item.segments
                            .map(
                              (s) =>
                                `${s.marketingCarrier ?? ''}${s.flightNumber ?? ''} ${s.originIata}→${s.destinationIata}`
                            )
                            .join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="text-right tabular-nums text-[#556974]">
                      {formatMoney(item.costMinor * item.qty, order.currency)}
                    </td>
                    <td className="text-right tabular-nums text-[#1a5852]">
                      {formatMoney(item.markupMinor * item.qty, order.currency)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatMoney(item.priceMinor * item.qty, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="text-base font-bold text-ink">Customer</h2>
            <p className="mt-2 font-semibold text-ink">{order.customer.name}</p>
            <p className="text-[#556974]">{order.customer.email}</p>
            {order.customer.phone && <p className="text-[#556974]">{order.customer.phone}</p>}
            <p className="mt-3 font-semibold text-ink">Passengers</p>
            <ul className="text-[#556974]">
              {order.passengers.map((p) => (
                <li key={p.id}>
                  {p.givenName} {p.familyName}
                </li>
              ))}
            </ul>
            {order.enquiry && (
              <p className="mt-3">
                From{' '}
                <Link href={`/admin/enquiries/${order.enquiry.id}`} className="font-semibold">
                  {order.enquiry.reference}
                </Link>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="text-base font-bold text-ink">Confirmation</h2>
            {order.documents.length === 0 ? (
              <p className="mt-2 text-[#718793]">Not issued.</p>
            ) : (
              <>
                <p className="mt-2">
                  <span className="text-[#718793]">Status:</span>{' '}
                  <span
                    className={
                      order.documents[0].deliveryStatus === 'sent'
                        ? 'font-bold text-[#1a5852]'
                        : 'font-bold text-[#9c4514]'
                    }
                  >
                    {order.documents[0].deliveryStatus}
                  </span>
                </p>
                <p className="text-[#718793]">
                  Issued{' '}
                  {order.documents[0].issuedAt.toLocaleString('en-GB', {
                    timeZone: 'Europe/London',
                  })}
                </p>
                {order.documents[0].documentUrl && (
                  <a
                    href={order.documents[0].documentUrl}
                    className="btn btn-secondary btn-block mt-3 no-underline"
                  >
                    Download PDF
                  </a>
                )}
              </>
            )}
            <p className="mt-3 border-t border-line pt-3 text-xs text-[#718793]">
              {order.protectionHolder
                ? `Sold under ${order.protectionHolder} — ${order.protectionNumber}`
                : 'Sold with no accreditation configured, so the document carries no protection claim.'}
            </p>
          </div>

          {order.remittance && (
            <div className="rounded-2xl border border-line bg-white p-5 text-sm">
              <h2 className="text-base font-bold text-ink">Remittance</h2>
              <p className="mt-2">
                <span className="text-[#718793]">Owed onward:</span>{' '}
                <strong>{formatMoney(order.remittance.amountMinor, order.currency)}</strong>
              </p>
              <p className="text-[#718793]">
                Due {order.remittance.dueAt.toLocaleDateString('en-GB')}
              </p>
              {order.remittance.remitted ? (
                <p className="mt-2 font-bold text-[#1a5852]">
                  Remitted {order.remittance.remittedAt?.toLocaleDateString('en-GB')}
                </p>
              ) : (
                <form action={markRemitted}>
                  <button type="submit" className="btn btn-secondary btn-block mt-3">
                    Mark as remitted
                  </button>
                </form>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
