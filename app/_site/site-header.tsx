import Link from 'next/link';
import LanguageSwitcher from '../language-switcher';
import MobileMenu from '../mobile-menu';
import HeaderAccount from '../header-account';
import SectionLink from './section-link';
import ArrowIcon from './arrow-icon';
import { isLinkVisible } from '../../lib/site-sections';

export const mainNav = [
  { href: '/#services', label: 'บริการ' },
  { href: '/#about', label: 'เกี่ยวกับเรา' },
  { href: '/#process', label: 'ขั้นตอน' },
  { href: '/#faq', label: 'คำถามที่พบบ่อย' },
  { href: '/blog', label: 'บทความ' },
];

export default function SiteHeader({ hidden = [] }: { hidden?: readonly string[] }) {
  return <header className="site-header">
    <Link href="/" aria-label="หน้าแรก"><span className="brand"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></span></Link>
    <nav className="desktop-nav" aria-label="เมนูหลัก">{mainNav.filter(item => isLinkVisible(item.href, hidden)).map(item => <SectionLink key={item.href} href={item.href}>{item.label}</SectionLink>)}</nav>
    <div className="header-actions"><LanguageSwitcher /><HeaderAccount /><SectionLink className="button small desktop-consult" href="#contact"><span>ปรึกษาฟรี</span><ArrowIcon /></SectionLink><MobileMenu hidden={[...hidden]} /></div>
  </header>;
}
