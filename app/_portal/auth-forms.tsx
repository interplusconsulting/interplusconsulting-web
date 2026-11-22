'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { errorText, isSupabaseConfigured, supabase } from '../../lib/supabase';
import { NotConfigured } from './shell';
import { ValidatedField, useValidatedForm } from './validated-form';
import { formatPhone, passwordChecks, sanitizePhone, validateConfirm, validateEmail, validateFullName, validatePassword, validatePhone } from '../../lib/validation';

/** Shared layout for login, register, forgot-password and reset-password: photo side + form panel. */
function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  if (!isSupabaseConfigured) return <NotConfigured />;
  return <div className="ip-auth ip-auth-login">
    <aside className="ip-auth-art">
      <Link href="/" aria-label="กลับหน้าแรก"><Image src="/inter-plus-logo-transparent.webp" width={128} height={58} alt="Inter Plus Consulting" /></Link>
      <div className="ip-login-photo" aria-hidden="true">
        <Image src="/hero-study-abroad.webp" alt="" fill sizes="(max-width: 760px) 100vw, 51vw" />
      </div>
      <div className="ip-auth-art-copy">
        <h2>เรียนได้ทุกที่<br />ทุกเวลา</h2>
        <p>คอร์สออนไลน์จาก Inter Plus Consulting และ Learning Plus by Kru Jew</p>
      </div>
    </aside>
    <section className="ip-auth-panel">
      <div className="ip-auth-box">
        <h1>{title}</h1>
        <p className="ip-muted">{subtitle}</p>
        {children}
      </div>
    </section>
  </div>;
}

function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '';
}

const loginValidators = {
  email: (value: string) => validateEmail(value),
  password: (value: string) => (value ? '' : 'กรุณากรอกรหัสผ่าน'),
};
const loginInitial = { email: '', password: '' };
const emailValidators = { email: (value: string) => validateEmail(value) };
const emailInitial = { email: '' };
const newPasswordValidators = {
  password: (value: string) => validatePassword(value),
  confirm: (value: string, all: Record<'password' | 'confirm', string>) => validateConfirm(all.password, value),
};
const newPasswordInitial = { password: '', confirm: '' };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, session, profile } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get('next'));

  useEffect(() => {
    if (ready && session && profile) router.replace(next || (profile.role === 'admin' ? '/admin' : '/learn'));
  }, [ready, session, profile, next, router]);

  const form = useValidatedForm(loginInitial, loginValidators);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { focusField(invalid); return; }
    setBusy(true); setError('');
    const { error: signInError } = await supabase().auth.signInWithPassword({ email: form.values.email.trim().toLowerCase(), password: form.values.password });
    setBusy(false);
    if (signInError) setError(errorText(signInError));
  };

  return <AuthLayout title="เข้าสู่ระบบ" subtitle="ใช้อีเมลและรหัสผ่านของบัญชีคุณ">
    <form className="ip-form" onSubmit={submit} noValidate>
      <ValidatedField label="อีเมล" {...form.fieldProps('email')} transform={value => value.replace(/\s/g, '')} type="email" inputMode="email" autoComplete="email" maxLength={254} />
      <ValidatedField label="รหัสผ่าน" {...form.fieldProps('password')} type="password" autoComplete="current-password" maxLength={72} />
      {error && <p className="ip-error" role="alert">{error}</p>}
      <button className="ip-btn wide" type="submit" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
    </form>
    <div className="ip-auth-links"><Link href="/forgot-password">ลืมรหัสผ่าน?</Link><span>ยังไม่มีบัญชี? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>สมัครสมาชิก</Link></span></div>
  </AuthLayout>;
}

type RegisterField = 'full_name' | 'phone' | 'email' | 'password' | 'confirm';
const registerValidators = {
  full_name: (value: string) => validateFullName(value),
  phone: (value: string) => validatePhone(value),
  email: (value: string) => validateEmail(value),
  password: (value: string) => validatePassword(value),
  confirm: (value: string, all: Record<RegisterField, string>) => validateConfirm(all.password, value),
};
const registerInitial: Record<RegisterField, string> = { full_name: '', phone: '', email: '', password: '', confirm: '' };

export function PasswordChecklist({ value }: { value: string }) {
  return <ul className="ip-pw-checks">{passwordChecks(value).map(check => <li key={check.label} className={check.ok ? 'ok' : ''}>{check.ok ? '✓' : '•'} {check.label}</li>)}</ul>;
}

function focusField(name: string) {
  document.getElementById(`field-${name}`)?.focus();
}

export function RegisterForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'confirm' | 'signed-in' | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const form = useValidatedForm(registerInitial, registerValidators);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { setError('กรุณาแก้ไขข้อมูลที่ไม่ถูกต้องก่อนสมัคร'); focusField(invalid); return; }
    const { values } = form;
    setBusy(true); setError('');
    const { data, error: signUpError } = await supabase().auth.signUp({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      options: {
        data: { full_name: values.full_name.trim().replace(/\s+/g, ' '), phone: formatPhone(values.phone) },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);
    if (signUpError) { setError(errorText(signUpError)); return; }
    if (data.user && data.user.identities?.length === 0) { setError('อีเมลนี้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบหรือใช้ “ลืมรหัสผ่าน”'); return; }
    if (data.session) { setDone('signed-in'); router.replace(next || '/learn'); } else setDone('confirm');
  };

  if (done === 'confirm') return <AuthLayout title="ตรวจสอบอีเมลของคุณ" subtitle="">
    <p>เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กดลิงก์ในอีเมลเพื่อยืนยัน แล้วกลับมาเข้าสู่ระบบ</p>
    <Link className="ip-btn wide" href="/login">ไปหน้าเข้าสู่ระบบ</Link>
  </AuthLayout>;

  return <AuthLayout title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อซื้อและเรียนคอร์สออนไลน์">
    <form className="ip-form" onSubmit={submit} noValidate>
      <ValidatedField label="ชื่อ-นามสกุล" {...form.fieldProps('full_name')} autoComplete="name" maxLength={120} placeholder="เช่น สมชาย ใจดี" />
      <ValidatedField label="เบอร์โทรศัพท์มือถือ" {...form.fieldProps('phone')} transform={sanitizePhone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={16} placeholder="0812345678" hint="ตัวเลข 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09" />
      <ValidatedField label="อีเมล" {...form.fieldProps('email')} transform={value => value.replace(/\s/g, '')} type="email" inputMode="email" autoComplete="email" maxLength={254} placeholder="name@example.com" />
      <ValidatedField label="รหัสผ่าน" {...form.fieldProps('password')} type="password" autoComplete="new-password" maxLength={72} hint={<PasswordChecklist value={form.values.password} />} />
      <ValidatedField label="ยืนยันรหัสผ่าน" {...form.fieldProps('confirm')} type="password" autoComplete="new-password" maxLength={72} />
      {error && <p className="ip-error" role="alert">{error}</p>}
      <button className="ip-btn wide" type="submit" disabled={busy || done === 'signed-in'}>{busy ? 'กำลังสมัคร…' : 'สมัครสมาชิก'}</button>
    </form>
    <div className="ip-auth-links"><span>มีบัญชีอยู่แล้ว? <Link href="/login">เข้าสู่ระบบ</Link></span></div>
  </AuthLayout>;
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const form = useValidatedForm(emailInitial, emailValidators);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.validateAll()) { focusField('email'); return; }
    setBusy(true); setError('');
    const { error: resetError } = await supabase().auth.resetPasswordForEmail(form.values.email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (resetError) setError(errorText(resetError)); else setSent(true);
  };

  return <AuthLayout title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้">
    {sent ? <p className="ip-success">ถ้าอีเมลนี้มีบัญชีอยู่ จะได้รับลิงก์ตั้งรหัสผ่านใหม่ภายในไม่กี่นาที</p> : <form className="ip-form" onSubmit={submit} noValidate>
      <ValidatedField label="อีเมล" {...form.fieldProps('email')} transform={value => value.replace(/\s/g, '')} type="email" inputMode="email" autoComplete="email" maxLength={254} />
      {error && <p className="ip-error" role="alert">{error}</p>}
      <button className="ip-btn wide" type="submit" disabled={busy}>{busy ? 'กำลังส่ง…' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}</button>
    </form>}
    <div className="ip-auth-links"><Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link></div>
  </AuthLayout>;
}

export function ResetPasswordForm() {
  const { ready, session } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const form = useValidatedForm(newPasswordInitial, newPasswordValidators);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { focusField(invalid); return; }
    setBusy(true); setError('');
    const { error: updateError } = await supabase().auth.updateUser({ password: form.values.password });
    setBusy(false);
    if (updateError) setError(errorText(updateError)); else router.replace('/learn');
  };

  return <AuthLayout title="ตั้งรหัสผ่านใหม่" subtitle="กรอกรหัสผ่านใหม่ที่ต้องการ">
    {ready && !session ? <p className="ip-error">ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่ที่หน้า <Link href="/forgot-password">ลืมรหัสผ่าน</Link></p> : <form className="ip-form" onSubmit={submit} noValidate>
      <ValidatedField label="รหัสผ่านใหม่" {...form.fieldProps('password')} type="password" autoComplete="new-password" maxLength={72} hint={<PasswordChecklist value={form.values.password} />} />
      <ValidatedField label="ยืนยันรหัสผ่านใหม่" {...form.fieldProps('confirm')} type="password" autoComplete="new-password" maxLength={72} />
      {error && <p className="ip-error" role="alert">{error}</p>}
      <button className="ip-btn wide" type="submit" disabled={busy || !ready}>{busy ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}</button>
    </form>}
  </AuthLayout>;
}
