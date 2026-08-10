import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { requiresRemittance } from '@/lib/payments';

export const metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/orders/new', label: 'Log manual order' },
  { href: '/admin/hotels', label: 'Hotels' },
];

/** Everything in this route group requires a valid admin session. */
export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) redirect('/admin/login');

  const nav = requiresRemittance()
    ? [...NAV, { href: '/admin/remittances', label: 'Remittances' }]
    : NAV;

  return (
    <div className="min-h-screen bg-sky">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-lg font-bold text-ink">
            eZAY <span className="text-sm font-semibold text-[#556974]">admin</span>
          </span>
          <nav aria-label="Admin" className="flex flex-wrap gap-x-5 gap-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[#556974] no-underline hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm text-[#556974] no-underline hover:text-ink">
            View site →
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
