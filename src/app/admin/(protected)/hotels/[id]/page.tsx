import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { formatMoney, parseMajorToMinor } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function HotelDetail({ params }: { params: { id: string } }) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: params.id },
    include: { rates: { orderBy: { createdAt: 'asc' } } },
  });
  if (hotel === null) notFound();

  /** Verifying a rate is what makes it sellable and publicly quotable. */
  async function verifyRate(formData: FormData) {
    'use server';
    const rateId = String(formData.get('rateId') ?? '');
    const cost = String(formData.get('cost') ?? '').trim();
    const sell = String(formData.get('sell') ?? '').trim();
    const source = String(formData.get('source') ?? '').trim();

    if (source === '') {
      // A verified rate without a provenance note is not verified, it is a
      // guess with a tick next to it.
      redirect(`/admin/hotels/${params.id}?error=source`);
    }

    await prisma.hotelRate.update({
      where: { id: rateId },
      data: {
        ...(cost !== '' ? { costMinor: parseMajorToMinor(cost) } : {}),
        ...(sell !== '' ? { sellMinor: parseMajorToMinor(sell) } : {}),
        source,
        verifiedAt: new Date(),
      },
    });

    revalidatePath(`/admin/hotels/${params.id}`);
    revalidatePath('/admin/hotels');
    redirect(`/admin/hotels/${params.id}`);
  }

  async function unverifyRate(formData: FormData) {
    'use server';
    const rateId = String(formData.get('rateId') ?? '');
    await prisma.hotelRate.update({
      where: { id: rateId },
      data: { verifiedAt: null },
    });
    revalidatePath(`/admin/hotels/${params.id}`);
    revalidatePath('/admin/hotels');
    redirect(`/admin/hotels/${params.id}`);
  }

  return (
    <div>
      <Link href="/admin/hotels" className="text-sm text-[#556974] no-underline">
        ← All hotels
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">{hotel.name}</h1>
      <p className="mt-1 text-[#556974]">
        {hotel.city}, {hotel.country}
        {hotel.distanceNote && ` · ${hotel.distanceNote}`}
      </p>
      {hotel.bookingUrl && (
        <p className="mt-1 text-sm">
          <a href={hotel.bookingUrl} target="_blank" rel="noopener">
            {hotel.bookingUrl}
          </a>
        </p>
      )}

      <div className="mt-6 space-y-4">
        {hotel.rates.map((rate) => (
          <section key={rate.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-bold text-ink">
                {rate.roomType}
                {rate.board && <span className="font-normal text-[#556974]"> · {rate.board}</span>}
              </h2>
              {rate.verifiedAt === null ? (
                <span className="rounded-full bg-[#9c4514] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Placeholder — not sellable
                </span>
              ) : (
                <span className="rounded-full bg-[#e6f6f4] px-2.5 py-1 text-xs font-semibold text-[#123d39]">
                  Verified {rate.verifiedAt.toLocaleDateString('en-GB')}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-[#556974]">
              Currently {formatMoney(rate.costMinor, rate.currency)} cost /{' '}
              {formatMoney(rate.sellMinor, rate.currency)} sell per room per night.
              {rate.source && <span className="block text-xs text-[#718793]">{rate.source}</span>}
            </p>

            {rate.verifiedAt === null ? (
              <form action={verifyRate} className="mt-4 grid gap-3 sm:grid-cols-[120px_120px_1fr_auto]">
                <input type="hidden" name="rateId" value={rate.id} />
                <div className="field">
                  <label htmlFor={`cost-${rate.id}`}>Cost £</label>
                  <input
                    id={`cost-${rate.id}`}
                    name="cost"
                    className="input tabular-nums"
                    inputMode="decimal"
                    defaultValue={(rate.costMinor / 100).toFixed(2)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`sell-${rate.id}`}>Sell £</label>
                  <input
                    id={`sell-${rate.id}`}
                    name="sell"
                    className="input tabular-nums"
                    inputMode="decimal"
                    defaultValue={(rate.sellMinor / 100).toFixed(2)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`source-${rate.id}`}>Where this quote came from</label>
                  <input
                    id={`source-${rate.id}`}
                    name="source"
                    className="input"
                    required
                    placeholder="Live quote 12 Aug 2026, revenue manager"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn btn-primary">
                    Verify
                  </button>
                </div>
              </form>
            ) : (
              <form action={unverifyRate} className="mt-3">
                <input type="hidden" name="rateId" value={rate.id} />
                <button type="submit" className="btn btn-secondary">
                  Mark as placeholder again
                </button>
              </form>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
