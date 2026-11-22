'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { dashboardSections } from './dashboard-sections';
import { useAuth } from '../../lib/auth';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { setLearnViewMode, useLearnViewMode } from '../../lib/student-access';
import type { Role } from '../../lib/types';

type IconName = 'layout' | 'wallet' | 'settings' | 'clipboard' | 'star' |'inbox' |'home' | 'book' | 'grid' | 'receipt' | 'user' | 'slip' | 'post' | 'megaphone' | 'users' | 'switch' | 'logout' | 'globe';
type NavItem = { href: string; label: string; icon: IconName };
type NavGroup = { group: string; icon: IconName; items: NavItem[] };
type NavHeading = { heading: string };
type NavEntry = NavItem | NavGroup | NavHeading;
const isGroup = (entry: NavEntry): entry is NavGroup => 'group' in entry;
const isHeading = (entry: NavEntry): entry is NavHeading => 'heading' in entry;
const flatten = (entries: NavEntry[]): NavItem[] => entries.flatMap(entry => (isHeading(entry) ? [] : isGroup(entry) ? entry.items : [entry]));

const studentNav: NavItem[] = [
  { href: '/learn', label: 'คอร์สเรียนของฉัน', icon: 'book' },
  { href: '/learn/courses', label: 'คอร์สเรียนทั้งหมด', icon: 'grid' },
  { href: '/learn/exams', label: 'คลังข้อสอบ', icon: 'clipboard' },
  { href: '/learn/orders', label: 'คำสั่งซื้อ', icon: 'receipt' },
  { href: '/learn/profile', label: 'ข้อมูลส่วนตัว', icon: 'user' },
];

const adminNav: NavEntry[] = [
  { group: 'ภาพรวม', icon: 'home', items: [
    { href: '/admin', label: 'ภาพรวมทั้งหมด', icon: 'home' },
    ...dashboardSections.map(({ slug, label, icon }) => ({ href: `/admin/overview/${slug}`, label, icon })),
  ] },
  { heading: 'การขาย' },
  { group: 'การชำระเงิน', icon: 'wallet', items: [
    { href: '/admin/orders', label: 'ตรวจสลิป', icon: 'slip' },
    { href: '/admin/payment-settings', label: 'ตั้งค่าการชำระเงิน', icon: 'settings' },
  ] },
  { href: '/admin/contacts', label: 'ผู้ติดต่อ', icon: 'inbox' },
  { heading: 'คอร์สและข้อสอบ' },
  { href: '/admin/courses', label: 'จัดการคอร์ส', icon: 'book' },
  { href: '/admin/exams', label: 'คลังข้อสอบ', icon: 'clipboard' },
  { heading: 'หน้าเว็บไซต์' },
  { href: '/admin/site-settings', label: 'ตั้งค่าการแสดงหน้าเว็บ', icon: 'layout' },
  { href: '/admin/announcements', label: 'จัดการประกาศ', icon: 'megaphone' },
  { href: '/admin/posts', label: 'จัดการโพสต์', icon: 'post' },
  { href: '/admin/reviews', label: 'จัดการรีวิว', icon: 'star' },
  { heading: 'ระบบ' },
  { href: '/admin/users', label: 'จัดการผู้ใช้', icon: 'users' },
];

const iconPaths: Record<IconName, string> = {
  layout: 'M4 4h16v16H4zM4 9h16M10 9v11M13 13h4M13 16h4',
  inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12l2 2 4-4M8 17h8',
  wallet: 'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l12-3v3M16 13h2',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.8 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.8-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003.6 15H3a2 2 0 110-4h.1a1.7 1.7 0 001.2-2.8l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0010 3.6V3a2 2 0 114 0v.1a1.7 1.7 0 002.8 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.2 1.9H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  slip: 'M4 5h16v14H4zM4 9h16M8 14h4',
  post: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  megaphone: 'M3 10v4h4l7 5V5L7 10zM17 9a4 4 0 010 6',
  users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-5-6',
  switch: 'M7 7h13l-4-4M17 17H4l4 4',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
};

function Icon({ name }: { name: IconName }) {
  return <svg className="ip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}

/** Sidebar group with sub-menu (e.g. Payment → ตั้งค่าการชำระเงิน, ตรวจสลิป). Opens automatically when one of its pages is active. */
/** Small number next to a menu item, e.g. slips waiting for review. */
function NavCount({ value }: { value?: number }) {
  if (!value) return null;
  return <em className="ip-nav-count" aria-label={`${value} รายการรอดำเนินการ`}>{value > 99 ? '99+' : value}</em>;
}

function NavGroupBlock({ group, collapsed, isActive, counts }: { group: NavGroup; collapsed: boolean; isActive: (href: string) => boolean; counts: Record<string, number> }) {
  const hasActive = group.items.some(item => isActive(item.href));
  const groupCount = group.items.reduce((sum, item) => sum + (counts[item.href] ?? 0), 0);
  const pathname = usePathname();
  const [preference, setPreference] = useState<{ pathname: string; expanded: boolean }>();
  const expanded = preference?.pathname === pathname ? preference.expanded : hasActive;
  const id = useId();
  return <>
  {collapsed && <div className="admin-compact-links">{group.items.map(item => <Link key={item.href} href={item.href} title={`${group.group} · ${item.label}`} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span><NavCount value={counts[item.href]} /></Link>)}</div>}
  <div className={`ip-nav-group ${hasActive ? 'has-active' : ''}`}>
    <button type="button" className="ip-nav-group-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setPreference({ pathname, expanded: !expanded })}>
      <Icon name={group.icon} /><span>{group.group}</span>{!expanded && <NavCount value={groupCount} />}<svg className="ip-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <div id={id} className="ip-nav-sub" hidden={!expanded}>
      {group.items.map(item => <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span><NavCount value={counts[item.href]} /></Link>)}
    </div>
  </div></>;
}

export function NotConfigured() {
  return <div className="ip-center"><div className="ip-card ip-narrow">
    <p className="ip-eyebrow">SETUP REQUIRED</p>
    <h1>ยังไม่ได้เชื่อมต่อฐานข้อมูล</h1>
    <p>ระบบสมาชิกต้องใช้ Supabase กรุณาใส่ค่า <code>NEXT_PUBLIC_SUPABASE_URL</code> และ <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ในไฟล์ <code>.env.local</code> (ดูตัวอย่างใน <code>.env.example</code>) แล้วรันเว็บใหม่</p>
    <Link className="ip-btn" href="/">กลับหน้าแรก</Link>
  </div></div>;
}

export function Loading({ text = 'กำลังโหลด…' }: { text?: string }) {
  return <div className="ip-loading" role="status"><span className="ip-spinner" aria-hidden="true" />{text}</div>;
}

export default function PortalShell({ area, children }: { area: Role; children: ReactNode }) {
  const { ready, session, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const learnViewMode = useLearnViewMode();
  const [collapsed, setCollapsed] = useState(() => {
    try { return typeof window !== 'undefined' && window.localStorage.getItem('ip-sidebar-collapsed') === '1'; } catch { return false; }
  });
  const toggleCollapsed = () => setCollapsed(value => {
    try { window.localStorage.setItem('ip-sidebar-collapsed', value ? '0' : '1'); } catch { /* storage unavailable */ }
    return !value;
  });
  /** The logo reloads the current page instead of leaving the member area. */
  const reloadPage = (event: React.MouseEvent) => { event.preventDefault(); window.location.reload(); };
  const nav: NavEntry[] = area === 'admin' ? adminNav : studentNav;
  const blocked = ready && session && profile && (!profile.is_active || (area === 'admin' && profile.role !== 'admin'));
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Admin menu badges: slips waiting for review and new contact requests. Refreshed on every page change.
  useEffect(() => {
    if (area !== 'admin' || profile?.role !== 'admin') return;
    const db = supabase();
    Promise.all([
      db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]).then(([orders, contacts]) => setCounts({ '/admin/orders': orders.count ?? 0, '/admin/contacts': contacts.count ?? 0 }));
  }, [area, profile?.role, pathname]);

  useEffect(() => {
    if (ready && isSupabaseConfigured && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, session, router, pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    menuClose.current?.focus();
    const desktop = window.matchMedia('(min-width: 981px)');
    const closeOnDesktop = () => { if (menuClose.current && desktop.matches) setMenuOpen(false); };
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuTrigger.current?.focus();
    };
    document.addEventListener('keydown', close);
    desktop.addEventListener('change', closeOnDesktop);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', close);
      desktop.removeEventListener('change', closeOnDesktop);
      document.body.classList.remove('modal-open');
    };
  }, [menuOpen]);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (!ready || !session || (!profile && !blocked)) return <Loading />;

  if (blocked) {
    return <div className="ip-center"><div className="ip-card ip-narrow">
      <h1>{profile?.is_active ? 'ไม่มีสิทธิ์เข้าหน้านี้' : 'บัญชีถูกระงับการใช้งาน'}</h1>
      <p>{profile?.is_active ? 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น' : 'กรุณาติดต่อ Inter Plus Consulting เพื่อสอบถามรายละเอียด'}</p>
      <div className="ip-row">{profile?.is_active && <Link className="ip-btn" href="/learn">ไปหน้าคอร์สของฉัน</Link>}<button type="button" className="ip-btn ghost" onClick={() => void signOut()}>ออกจากระบบ</button></div>
    </div></div>;
  }

  const isActive = (href: string) => href === pathname || (href !== '/learn' && href !== '/admin' && pathname.startsWith(`${href}/`));

  const current = flatten(nav).find(item => isActive(item.href));

  const switchLabel = area === 'admin' ? 'มุมมองผู้เรียน' : 'หลังบ้าน';
  const viewMode = learnViewMode;
  const logout = async () => { await signOut(); router.replace('/login'); };
  const initial = (profile?.full_name || profile?.email || '?').trim().slice(0, 1).toUpperCase();

  // Students get a horizontal tab bar across the top; admins keep the collapsible left sidebar.
  if (area === 'student') {
    return <div className={`ip-shell-top ${menuOpen ? 'menu-open' : ''}`}>
      <header className="ip-tabbar">
        <div className="ip-tabbar-inner">
          <a href={pathname} onClick={reloadPage} className="ip-brand" aria-label="รีเฟรชหน้านี้" title="รีเฟรชหน้านี้"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></a>
          <button type="button" className="ip-burger" aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={menuOpen} aria-controls="ip-tabbar-menu" onClick={() => setMenuOpen(open => !open)}><span /><span /><span /></button>
          <div id="ip-tabbar-menu" className="ip-tabbar-menu" onClick={event => { if ((event.target as HTMLElement).closest('a')) setMenuOpen(false); }}>
            <nav aria-label="เมนูผู้เรียน">
              {flatten(nav).map(item => <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}
            </nav>
            <div className="ip-tabbar-side">
              {profile?.role === 'admin' && <div className="ip-view-toggle" role="group" aria-label="เลือกมุมมอง (เฉพาะแอดมิน)" title="เฉพาะแอดมินเห็นปุ่มนี้">
                <button type="button" className={viewMode === 'student' ? 'active' : ''} aria-pressed={viewMode === 'student'} aria-label="มุมมองผู้เรียน" onClick={() => setLearnViewMode('student')}>ผู้เรียน</button>
                <button type="button" className={viewMode === 'admin' ? 'active' : ''} aria-pressed={viewMode === 'admin'} aria-label="มุมมองแอดมิน" onClick={() => setLearnViewMode('admin')}>แอดมิน</button>
              </div>}
              {profile?.role === 'admin' && <Link className="ip-tab-link" href="/admin" title={switchLabel} aria-label={switchLabel}><Icon name="switch" /><span>{switchLabel}</span></Link>}
              <Link className="ip-tab-link" href="/" title="หน้าเว็บไซต์" aria-label="หน้าเว็บไซต์"><Icon name="globe" /><span>หน้าเว็บไซต์</span></Link>
              <span className="ip-tab-user" title={profile?.email}><span className="ip-avatar" aria-hidden="true">{initial}</span><span className="ip-tab-user-name">{profile?.full_name || profile?.email}</span></span>
              <button type="button" className="ip-tab-link" title="ออกจากระบบ" aria-label="ออกจากระบบ" onClick={() => void logout()}><Icon name="logout" /><span>ออกจากระบบ</span></button>
            </div>
          </div>
        </div>
      </header>
      <main className="ip-main">{children}</main>
    </div>;
  }

  return <div className={`ip-shell ${area} ${menuOpen ? 'menu-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
    <header className="admin-desktopbar">
      <span>หลังบ้าน</span><span aria-hidden="true">/</span><strong>{current?.label ?? 'จัดการข้อมูล'}</strong>
      <Link href="/learn" onClick={() => setLearnViewMode('student')}><Icon name="switch" />มุมมองผู้เรียน</Link>
    </header>
    <header className="ip-mobilebar">
      <button ref={menuTrigger} type="button" className="ip-burger" aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={menuOpen} aria-controls="ip-sidebar" onClick={() => setMenuOpen(open => !open)}><span /><span /><span /></button>
      <strong>{current?.label ?? (area === 'admin' ? 'หลังบ้าน' : 'ห้องเรียน')}</strong>
      <a href={pathname} onClick={reloadPage} className="ip-brand small" aria-label="รีเฟรชหน้านี้" title="รีเฟรชหน้านี้"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></a>
    </header>
    <div className="ip-sidebar-backdrop" aria-hidden="true" onClick={() => { setMenuOpen(false); menuTrigger.current?.focus(); }} />
    <aside id="ip-sidebar" className="ip-sidebar" onClick={event => {
      if (!menuOpen || !(event.target as HTMLElement).closest('a[href^="/"]:not(.ip-brand)')) return;
      setMenuOpen(false);
      menuTrigger.current?.focus();
    }}>
      <div className="ip-sidebar-head">
        <a href={pathname} onClick={reloadPage} className="ip-brand" aria-label="รีเฟรชหน้านี้" title="รีเฟรชหน้านี้"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></a>
        <button ref={menuClose} type="button" className="admin-drawer-close" aria-label="ปิดเมนู" onClick={() => { setMenuOpen(false); menuTrigger.current?.focus(); }}>
          <svg className="ip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <button type="button" className="ip-collapse" onClick={toggleCollapsed} aria-label={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'} aria-expanded={!collapsed} title={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}>
        <svg className="ip-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} /></svg><span>{collapsed ? 'ขยาย' : 'ย่อเมนู'}</span>
      </button>
      <nav aria-label={area === 'admin' ? 'เมนูผู้ดูแล' : 'เมนูผู้เรียน'}>
        {nav.map(entry => isHeading(entry)
          ? <p key={entry.heading} className="ip-nav-heading">{entry.heading}</p>
          : isGroup(entry)
            ? <NavGroupBlock key={entry.group} group={entry} collapsed={collapsed} isActive={isActive} counts={counts} />
            : <Link key={entry.href} href={entry.href} title={collapsed ? entry.label : undefined} className={isActive(entry.href) ? 'active' : ''} aria-current={isActive(entry.href) ? 'page' : undefined}><Icon name={entry.icon} /><span>{entry.label}</span><NavCount value={counts[entry.href]} /></Link>)}
      </nav>
      <div className="ip-sidebar-foot">
        {profile?.role === 'admin' && <Link className="ip-side-link" href={area === 'admin' ? '/learn' : '/admin'} onClick={() => { if (area === 'admin') setLearnViewMode('student'); }} title={collapsed ? switchLabel : undefined}><Icon name="switch" /><span>{switchLabel}</span></Link>}
        <Link className="ip-side-link" href="/" title={collapsed ? 'หน้าเว็บไซต์' : undefined}><Icon name="globe" /><span>หน้าเว็บไซต์</span></Link>
        <div className="ip-user-card" title={collapsed ? `${profile?.full_name ?? ''} ${profile?.email ?? ''}` : undefined}>
          <span className="ip-avatar" aria-hidden="true">{(profile?.full_name || profile?.email || '?').trim().slice(0, 1).toUpperCase()}</span>
          <span className="ip-user-text"><b>{profile?.full_name || 'ผู้ใช้'}</b><small title={profile?.email}>{profile?.email}</small></span>
        </div>
        <button type="button" className="ip-side-link" title={collapsed ? 'ออกจากระบบ' : undefined} onClick={async () => { await signOut(); router.replace('/login'); }}><Icon name="logout" /><span>ออกจากระบบ</span></button>
      </div>
    </aside>
    <main className="ip-main">{children}</main>
  </div>;
}
