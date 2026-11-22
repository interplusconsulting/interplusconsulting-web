import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PortalShell from '../_portal/shell';

export const metadata: Metadata = { title: 'ห้องเรียนออนไลน์ | Inter Plus Consulting', robots: { index: false } };

export default function LearnLayout({ children }: { children: ReactNode }) {
  return <PortalShell area="student">{children}</PortalShell>;
}
