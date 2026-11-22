'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export default function HeaderAccount() {
  const { ready, session, profile } = useAuth();
  if (!isSupabaseConfigured) return null;
  const signedIn = ready && session;
  const href = signedIn ? (profile?.role === 'admin' ? '/admin' : '/learn') : '/login';
  return <Link className="header-account" href={href}>{signedIn ? 'คอร์สของฉัน' : 'เข้าสู่ระบบ'}</Link>;
}
