'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { smoothScrollToElement } from '../smooth-scroll';

/**
 * Link to a section such as "/#faq". On the page that holds the section it always scrolls there,
 * even when the URL already ends in the same #hash (a plain link does nothing in that case).
 * From other pages it navigates to the homepage section as usual.
 */
export default function SectionLink({ href, className, children, onNavigate }: { href: string; className?: string; children: ReactNode; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [path, hash] = href.split('#');

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    const samePage = path === '' || path === pathname; // "#contact" always means the current page
    if (!hash || !samePage || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const target = document.getElementById(hash);
    if (!target) return;
    event.preventDefault();
    smoothScrollToElement(`#${hash}`, 0);
    window.history.replaceState(null, '', `#${hash}`);
  };

  return <Link href={href} className={className} onClick={handleClick}>{children}</Link>;
}
