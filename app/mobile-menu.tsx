'use client';

import { useEffect, useState } from 'react';

const links = [
  ['#services', 'บริการ'],
  ['#about', 'เกี่ยวกับเรา'],
  ['#process', 'ขั้นตอน'],
] as const;

export default function MobileMenu() {
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
      {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<span>↗</span></a>)}
      <a className="mobile-consult" href="#contact" onClick={() => setOpen(false)}>ปรึกษาฟรี <span>↗</span></a>
    </nav>
  </div>;
}
