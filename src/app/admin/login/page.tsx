import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createSessionToken,
  isAdminAuthenticated,
  passwordIsCorrect,
} from '@/lib/adminAuth';

export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (isAdminAuthenticated()) redirect('/admin');

  async function signIn(formData: FormData) {
    'use server';
    const password = String(formData.get('password') ?? '');
    if (!passwordIsCorrect(password)) {
      redirect('/admin/login?error=1');
    }
    cookies().set(ADMIN_COOKIE, createSessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    redirect('/admin');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="mb-1 text-2xl font-bold text-ink">eZAY admin</h1>
      <p className="mb-6 text-sm text-[#556974]">Sign in to continue.</p>
      <form action={signIn} className="space-y-4">
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            required
            autoFocus
            autoComplete="current-password"
          />
        </div>
        {searchParams.error && (
          <p role="alert" className="text-sm font-semibold text-[#9c4514]">
            That password is not right.
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block">
          Sign in
        </button>
      </form>
    </div>
  );
}
