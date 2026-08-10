import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

/**
 * The hotel registry.
 *
 * A rate with a null verifiedAt is a PLACEHOLDER: it is badged loudly here,
 * withheld from the public site entirely, and refused by the manual-order
 * API if anyone tries to sell it.
 */
export default async function HotelsPage() {
  const hotels = await prisma.hotel.findMany({
    include: { rates: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
  });

  const placeholderCount = hotels.reduce(
    (total, hotel) => total + hotel.rates.filter((r) => r.verifiedAt === null).length,
    0
  );
  const rateCount = hotels.reduce((total, hotel) => total + hotel.rates.length, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Hotels</h1>
      <p className="mt-1 max-w-prose text-[#556974]">
        {hotels.length} properties, {rateCount} rates.{' '}
        {placeholderCount > 0 && (
          <strong className="text-[#9c4514]">
            {placeholderCount} are placeholders and cannot be sold.
          </strong>
        )}
      </p>

      {placeholderCount > 0 && (
        <div className="mt-5 rounded-2xl border-2 border-[#9c4514] bg-[#fff2e9] p-5">
          <h2 className="font-bold text-[#9c4514]">Placeholder rates are not real quotes</h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[#556974]">
            A rate is a placeholder until someone enters a real quote from the property and marks it
            verified. Until then the public site shows &ldquo;Ask us&rdquo; instead of a price, and
            the order form refuses to sell it. That is deliberate — quoting a made-up rate is how
            you lose money on a booking you have already confirmed.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {hotels.map((hotel) => (
          <section key={hotel.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-bold text-ink">
                  {hotel.name}
                  {hotel.starRating && (
                    <span className="ml-2 text-sm font-normal text-[#718793]">
                      {'★'.repeat(hotel.starRating)}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-[#556974]">
                  {hotel.city}, {hotel.country}
                  {hotel.distanceNote && ` · ${hotel.distanceNote}`}
                </p>
              </div>
              <Link href={`/admin/hotels/${hotel.id}`} className="btn btn-secondary no-underline">
                Edit rates
              </Link>
            </div>

            {hotel.notes && (
              <p className="mt-2 rounded-lg bg-surface p-2.5 text-sm text-[#556974]">
                {hotel.notes}
              </p>
            )}

            <table className="table mt-3">
              <thead>
                <tr>
                  <th scope="col">Room</th>
                  <th scope="col">Board</th>
                  <th scope="col" className="text-right">Cost/night</th>
                  <th scope="col" className="text-right">Sell/night</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {hotel.rates.map((rate) => (
                  <tr key={rate.id}>
                    <td>{rate.roomType}</td>
                    <td className="text-[#556974]">{rate.board ?? '—'}</td>
                    <td className="text-right tabular-nums text-[#556974]">
                      {formatMoney(rate.costMinor, rate.currency)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatMoney(rate.sellMinor, rate.currency)}
                    </td>
                    <td>
                      {rate.verifiedAt === null ? (
                        <span className="rounded-full bg-[#9c4514] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                          Placeholder
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#e6f6f4] px-2.5 py-1 text-xs font-semibold text-[#123d39]">
                          Verified {rate.verifiedAt.toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
