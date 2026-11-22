import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '../_portal/auth-forms';
import { Loading } from '../_portal/shell';

export const metadata: Metadata = { title: 'สมัครสมาชิก | Inter Plus Consulting', robots: { index: false } };

export default function Page() {
  return <Suspense fallback={<Loading />}><RegisterForm /></Suspense>;
}