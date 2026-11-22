import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PortalShell from '../_portal/shell';
import './admin.css';

export const metadata: Metadata = { title: 'หลังบ้าน | Inter Plus Consulting', robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PortalShell area="admin">{children}</PortalShell>;
}
