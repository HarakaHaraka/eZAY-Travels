'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney, parseMajorToMinor } from '@/lib/money';

type ItemType = 'flight' | 'hotel' | 'transfer' | 'ancillary' | 'insurance' | 'fee';

interface LineRow {
  itemType: ItemType;
  description: string;
  qty: string;
  cost: string;
  sell: string;
}

interface SegmentRow {
  marketingCarrier: string;
  flightNumber: string;
  originIata: string;
  destinationIata: string;
  departsAt: string;
  arrivesAt: string;
}

const EMPTY_SEGMENT: SegmentRow = {
  marketingCarrier: '',
  flightNumber: '',
  originIata: '',
  destinationIata: '',
  departsAt: '',
  arrivesAt: '',
};

function minor(value: string): number {
  if (value.trim() === '') return 0;
  try {
    return parseMajorToMinor(value);
  } catch {
    return 0;
  }
}

/**
 * Logging a Faremine or PTA booking. These are the highest-margin orders, so
 * the form shows margin live as you type and defaults the common case: one
 * flight line, one passenger, payment already taken.
 */
export function ManualOrderForm({
  enquiries,
  initialEnquiryId,
}: {
  enquiries: Array<{ id: string; reference: string; name: string; email: string; phone: string | null }>;
  initialEnquiryId?: string;
}) {
  const router = useRouter();

  const initial = enquiries.find((e) => e.id === initialEnquiryId);
  const [enquiryId, setEnquiryId] = useState(initialEnquiryId ?? '');
  const [supplier, setSupplier] = useState('faremine');
  const [supplierRef, setSupplierRef] = useState('');
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [paymentTaken, setPaymentTaken] = useState(true);
  const [notes, setNotes] = useState('');

  const [passengers, setPassengers] = useState([{ givenName: '', familyName: '' }]);
  const [lines, setLines] = useState<LineRow[]>([
    { itemType: 'flight', description: '', qty: '1', cost: '', sell: '' },
  ]);
  const [segments, setSegments] = useState<SegmentRow[]>([{ ...EMPTY_SEGMENT }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const qty = Math.max(1, Number(line.qty) || 1);
        const cost = minor(line.cost) * qty;
        const sell = minor(line.sell) * qty;
        return {
          cost: acc.cost + cost,
          sell: acc.sell + sell,
          margin: acc.margin + (sell - cost),
        };
      },
      { cost: 0, sell: 0, margin: 0 }
    );
  }, [lines]);

  const marginPct = totals.sell === 0 ? 0 : Math.round((totals.margin / totals.sell) * 1000) / 10;

  function setLine(index: number, patch: Partial<LineRow>) {
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function setSegment(index: number, patch: Partial<SegmentRow>) {
    setSegments((current) => current.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const hasFlight = lines.some((l) => l.itemType === 'flight');
    const usableSegments = segments.filter(
      (s) => s.originIata && s.destinationIata && s.departsAt && s.arrivesAt
    );

    const body = {
      supplier,
      supplierRef,
      customer: { name, email, phone: phone || undefined },
      passengers,
      enquiryId: enquiryId || undefined,
      notes: notes || undefined,
      paymentTaken,
      items: lines.map((line) => {
        const qty = Math.max(1, Number(line.qty) || 1);
        const cost = minor(line.cost);
        const sell = minor(line.sell);
        return {
          itemType: line.itemType,
          description: line.description,
          qty,
          costMinor: cost,
          markupMinor: sell - cost,
          segments:
            line.itemType === 'flight' && hasFlight && usableSegments.length > 0
              ? usableSegments
              : undefined,
        };
      }),
    };

    try {
      const response = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'Could not save that order.');
      router.push(`/admin/orders/${result.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Where you booked it</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="field">
              <label htmlFor="supplier">Supplier</label>
              <select
                id="supplier"
                className="input"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="faremine">Faremine</option>
                <option value="pta">Ticketing partner (PTA)</option>
                <option value="direct">Direct</option>
                <option value="duffel">Duffel</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="supplierRef">Their reference / PNR</label>
              <input
                id="supplierRef"
                className="input"
                required
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                placeholder="FM-884213"
              />
            </div>
            <div className="field">
              <label htmlFor="enquiryId">From enquiry</label>
              <select
                id="enquiryId"
                className="input"
                value={enquiryId}
                onChange={(e) => {
                  setEnquiryId(e.target.value);
                  const match = enquiries.find((en) => en.id === e.target.value);
                  if (match) {
                    if (!name) setName(match.name);
                    if (!email) setEmail(match.email);
                    if (!phone && match.phone) setPhone(match.phone);
                  }
                }}
              >
                <option value="">Not linked</option>
                {enquiries.map((enquiry) => (
                  <option key={enquiry.id} value={enquiry.id}>
                    {enquiry.reference} — {enquiry.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Customer</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="field">
              <label htmlFor="cname">Name</label>
              <input id="cname" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cemail">Email (the confirmation goes here)</label>
              <input
                id="cemail"
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="cphone">Phone</label>
              <input id="cphone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <h3 className="mt-5 text-sm font-bold text-ink">Passengers</h3>
          <div className="mt-2 space-y-2">
            {passengers.map((passenger, index) => (
              <div key={index} className="flex gap-3">
                <input
                  aria-label={`Passenger ${index + 1} first name`}
                  className="input"
                  required
                  placeholder="First name(s)"
                  value={passenger.givenName}
                  onChange={(e) =>
                    setPassengers((c) =>
                      c.map((p, i) => (i === index ? { ...p, givenName: e.target.value } : p))
                    )
                  }
                />
                <input
                  aria-label={`Passenger ${index + 1} last name`}
                  className="input"
                  required
                  placeholder="Last name"
                  value={passenger.familyName}
                  onChange={(e) =>
                    setPassengers((c) =>
                      c.map((p, i) => (i === index ? { ...p, familyName: e.target.value } : p))
                    )
                  }
                />
                {passengers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={`Remove passenger ${index + 1}`}
                    onClick={() => setPassengers((c) => c.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-2"
            onClick={() => setPassengers((c) => [...c, { givenName: '', familyName: '' }])}
          >
            + Add passenger
          </button>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">What they bought</h2>
          <p className="mt-1 text-sm text-[#556974]">
            Cost is what you pay the supplier; sell is what the customer pays. Margin is derived.
          </p>
          <div className="mt-4 space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[110px_1fr_60px_110px_110px_auto]">
                <select
                  aria-label={`Line ${index + 1} type`}
                  className="input"
                  value={line.itemType}
                  onChange={(e) => setLine(index, { itemType: e.target.value as ItemType })}
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="transfer">Transfer</option>
                  <option value="insurance">Insurance</option>
                  <option value="ancillary">Ancillary</option>
                  <option value="fee">Fee</option>
                </select>
                <input
                  aria-label={`Line ${index + 1} description`}
                  className="input"
                  required
                  placeholder="LHR → LOS return, Virgin Atlantic"
                  value={line.description}
                  onChange={(e) => setLine(index, { description: e.target.value })}
                />
                <input
                  aria-label={`Line ${index + 1} quantity`}
                  className="input"
                  inputMode="numeric"
                  value={line.qty}
                  onChange={(e) => setLine(index, { qty: e.target.value })}
                />
                <input
                  aria-label={`Line ${index + 1} cost`}
                  className="input tabular-nums"
                  inputMode="decimal"
                  placeholder="Cost £"
                  value={line.cost}
                  onChange={(e) => setLine(index, { cost: e.target.value })}
                />
                <input
                  aria-label={`Line ${index + 1} sell`}
                  className="input tabular-nums"
                  inputMode="decimal"
                  placeholder="Sell £"
                  value={line.sell}
                  onChange={(e) => setLine(index, { sell: e.target.value })}
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={`Remove line ${index + 1}`}
                    onClick={() => setLines((c) => c.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-2"
            onClick={() =>
              setLines((c) => [
                ...c,
                { itemType: 'hotel', description: '', qty: '1', cost: '', sell: '' },
              ])
            }
          >
            + Add line
          </button>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Flights</h2>
          <p className="mt-1 text-sm text-[#556974]">
            Optional, but it is what puts the itinerary on the customer&rsquo;s document.
          </p>
          <div className="mt-4 space-y-3">
            {segments.map((segment, index) => (
              <fieldset key={index} className="rounded-xl border border-line p-3">
                <legend className="px-1 text-xs font-bold text-[#556974]">Leg {index + 1}</legend>
                <div className="grid gap-2 sm:grid-cols-4">
                  <input
                    aria-label={`Leg ${index + 1} carrier`}
                    className="input uppercase"
                    maxLength={4}
                    placeholder="VS"
                    value={segment.marketingCarrier}
                    onChange={(e) => setSegment(index, { marketingCarrier: e.target.value })}
                  />
                  <input
                    aria-label={`Leg ${index + 1} flight number`}
                    className="input"
                    maxLength={6}
                    placeholder="411"
                    value={segment.flightNumber}
                    onChange={(e) => setSegment(index, { flightNumber: e.target.value })}
                  />
                  <input
                    aria-label={`Leg ${index + 1} origin`}
                    className="input uppercase"
                    maxLength={3}
                    placeholder="LHR"
                    value={segment.originIata}
                    onChange={(e) => setSegment(index, { originIata: e.target.value })}
                  />
                  <input
                    aria-label={`Leg ${index + 1} destination`}
                    className="input uppercase"
                    maxLength={3}
                    placeholder="LOS"
                    value={segment.destinationIata}
                    onChange={(e) => setSegment(index, { destinationIata: e.target.value })}
                  />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="field">
                    <label htmlFor={`dep-${index}`}>Departs</label>
                    <input
                      id={`dep-${index}`}
                      type="datetime-local"
                      className="input"
                      value={segment.departsAt}
                      onChange={(e) => setSegment(index, { departsAt: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`arr-${index}`}>Arrives</label>
                    <input
                      id={`arr-${index}`}
                      type="datetime-local"
                      className="input"
                      value={segment.arrivesAt}
                      onChange={(e) => setSegment(index, { arrivesAt: e.target.value })}
                    />
                  </div>
                </div>
                {segments.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost mt-2"
                    onClick={() => setSegments((c) => c.filter((_, i) => i !== index))}
                  >
                    Remove leg
                  </button>
                )}
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-2"
            onClick={() => setSegments((c) => [...c, { ...EMPTY_SEGMENT }])}
          >
            + Add leg
          </button>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the next person needs to know."
            />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Margin</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[#718793]">Sale</dt>
              <dd className="tabular-nums">{formatMoney(totals.sell)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#718793]">Cost</dt>
              <dd className="tabular-nums">{formatMoney(totals.cost)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-bold text-ink">You earn</span>
            <span
              className={`text-2xl font-bold tabular-nums ${
                totals.margin < 0 ? 'text-[#9c4514]' : 'text-[#1a5852]'
              }`}
            >
              {formatMoney(totals.margin)}
            </span>
          </p>
          <p className="mt-1 text-right text-sm text-[#718793]">{marginPct}% of sale</p>

          <label className="mt-4 flex items-start gap-2 text-sm text-[#556974]">
            <input
              type="checkbox"
              checked={paymentTaken}
              onChange={(e) => setPaymentTaken(e.target.checked)}
            />
            <span>Payment already taken</span>
          </label>

          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-[#9c4514]">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-block mt-4" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save and send confirmation'}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-[#718793]">
            Saving issues the customer&rsquo;s confirmation document and emails it, exactly as an
            online booking does. If that fails the order is held for attention rather than shown as
            confirmed.
          </p>
        </div>
      </aside>
    </form>
  );
}
