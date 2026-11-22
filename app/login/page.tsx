import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '../_portal/auth-forms';
import { Loading } from '../_portal/shell';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ | Inter Plus Consulting', robots: { index: false } };

export default function Page() {
  return <Suspense fallback={<Loading />}><LoginForm /></Suspense>;
}