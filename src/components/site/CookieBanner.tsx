'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'ezay-cookie-notice-v1';

/**
 * Cookie notice.
 *
 * The public site sets only strictly-necessary cookies (the admin session and
 * the fare-search session), which need no consent under PECR. There is no
 * analytics or advertising cookie. So this is a notice with a dismiss, not a
 * consent gate. If analytics is ever added, this must become an opt-in.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* storage blocked: just hide for this page view */
    }
    setShow(false);
  }

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <p>
        We use only the cookies the site needs to work. No tracking, no advertising.{' '}
        <Link href="/cookies">What we set and why</Link>.
      </p>
      <button className="btn btn-secondary" type="button" onClick={dismiss}>
        OK
      </button>
    </div>
  );
}
