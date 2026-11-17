'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * A 2px indigo bar across the top while a link navigation is pending.
 *
 * It appears only after 150ms (fast routes never flash it) and disappears by itself when the
 * pathname changes. Detection is a single capture-phase click listener on same-origin links that go
 * to a different pathname; query-only links are ignored (the pathname would not change, so the bar
 * would never clear). An 8s safety timer clears it if a navigation never lands.
 * Motion is a CSS translateX loop (`.mis-progress`); under reduced motion it is a static bar.
 */
export function RouteProgress() {
  const pathname = usePathname();
  // The pathname the bar was started on. Visible only while it still equals the current pathname.
  const [startedOn, setStartedOn] = useState<string | null>(null);
  const [seen, setSeen] = useState(pathname);
  const pathRef = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Path changed: forget the old bar (state adjusted during render, no effect needed).
  if (seen !== pathname) {
    setSeen(pathname);
    setStartedOn(null);
  }

  useEffect(() => {
    pathRef.current = pathname;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === pathRef.current) return;
      timers.current.forEach(clearTimeout);
      const from = pathRef.current;
      timers.current = [
        setTimeout(() => setStartedOn(from), 150),
        setTimeout(() => setStartedOn(null), 8000),
      ];
    };
    document.addEventListener('click', onClick, true);
    const pending = timers.current;
    return () => {
      document.removeEventListener('click', onClick, true);
      pending.forEach(clearTimeout);
    };
  }, []);

  if (startedOn === null || startedOn !== pathname) return null;
  return (
    <div role="progressbar" aria-label="Loading" aria-busy="true" data-route-progress="" className="mis-progress">
      <i />
    </div>
  );
}
