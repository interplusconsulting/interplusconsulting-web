import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'บทความและข่าวสาร | Inter Plus Consulting', description: 'บทความ เทคนิคการสอบ และข่าวสารจาก Inter Plus Consulting' };

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div className="ip-blog">
    <header className="ip-topbar simple">
      <Link href="/" className="ip-brand" aria-label="กลับหน้าแรก"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></Link>
      <nav aria-label="เมนู"><Link href="/">หน้าแรก</Link><Link href="/blog">บทความ</Link><Link href="/learn">คอร์สออนไลน์</Link></nav>
    </header>
    <main className="ip-main">{children}</main>
  </div>;
}
