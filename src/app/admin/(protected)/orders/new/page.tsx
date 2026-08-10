import Link from 'next/link';
import { ManualOrderForm } from '@/components/admin/ManualOrderForm';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NewManualOrderPage({
  searchParams,
}: {
  searchParams: { enquiry?: string };
}) {
  const enquiries = await prisma.enquiry.findMany({
    where: { stage: { notIn: ['lost'] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, reference: true, name: true, email: true, phone: true },
  });

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-[#556974] no-underline">
        ← All orders
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">Log a manual order</h1>
      <p className="mt-1 max-w-prose text-[#556974]">
        For anything booked on the Faremine or ticketing-partner portal. These get the same record,
        the same reference and the same confirmation document as an online booking — the customer
        cannot tell the difference, and they are our highest-margin sales.
      </p>

      <ManualOrderForm enquiries={enquiries} initialEnquiryId={searchParams.enquiry} />
    </div>
  );
}
