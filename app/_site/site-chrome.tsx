import type { ReactNode } from 'react';
import { getHiddenSections } from '../../lib/site-settings.server';
import FloatingContact from '../floating-contact';
import ScrollToTop from '../scroll-to-top';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';

/** Header, footer and floating buttons shared by the public pages. Menus follow Admin → ตั้งค่าการแสดงหน้าเว็บ. */
export default async function SiteChrome({ children, before }: { children: ReactNode; before?: ReactNode }) {
  const hidden = await getHiddenSections();
  return <main>{before}<ScrollToTop />{!hidden.includes('floating') && <FloatingContact />}
    <SiteHeader hidden={hidden} />
    {children}
    <SiteFooter hidden={hidden} />
  </main>;
}
