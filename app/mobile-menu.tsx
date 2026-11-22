'use client';

import { useEffect, useState } from 'react';
import SectionLink from './_site/section-link';
import { isLinkVisible } from '../lib/site-sections';

const links = [
  ['/#services', 'บริการ'],
  ['/#about', 'เกี่ยวกับเรา'],
  ['/#process', 'ขั้นตอน'],
  ['/#faq', 'คำถามที่พบบ่อย'],
  ['/blog', 'บทความ'],
  ['/login', 'เข้าสู่ระบบ / คอร์สออนไลน์'],
] as const;

export default function MobileMenu({ hidden = [] }: { hidden?: string[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return <div className={`mobile-menu${open ? ' is-open' : ''}`}>
    <button
      className="menu-toggle"
      type="button"
      aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
      aria-expanded={open}
      aria-controls="mobile-navigation"
      onClick={() => setOpen(value => !value)}
    >
      <span/><span/><span/>
    </button>
    <nav id="mobile-navigation" aria-label="เมนูมือถือ">
      {links.filter(([href]) => isLinkVisible(href, hidden)).map(([href, label]) => <SectionLink key={href} href={href} onNavigate={() => setOpen(false)}>{label}<span>↗︎</span></SectionLink>)}
      <SectionLink className="mobile-consult" href="#contact" onNavigate={() => setOpen(false)}>ปรึกษาฟรี <span>↗︎</span></SectionLink>
    </nav>
  </div>;
}
