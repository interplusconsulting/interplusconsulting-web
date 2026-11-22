'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../lib/auth';
import { errorText, supabase } from '../../../lib/supabase';
import type { Profile } from '../../../lib/types';
import { formatPhone, sanitizePhone, validateConfirm, validateFullName, validatePassword, validatePhone } from '../../../lib/validation';
import { PasswordChecklist } from '../../_portal/auth-forms';
import { ValidatedField, useValidatedForm } from '../../_portal/validated-form';

type Message = { ok: boolean; text: string } | null;

const contactValidators = { full_name: (value: string) => validateFullName(value), phone: (value: string) => validatePhone(value) };
const passwordValidators = {
  password: (value: string) => validatePassword(value),
  confirm: (value: string, all: Record<'password' | 'confirm', string>) => validateConfirm(all.password, value),
};
const passwordInitial = { password: '', confirm: '' };

function ContactForm({ profile, onSaved }: { profile: Profile; onSaved: () => Promise<void> }) {
  const [message, setMessage] = useState<Message>(null);
  const form = useValidatedForm({ full_name: profile.full_name, phone: sanitizePhone(profile.phone) }, contactValidators);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { document.getElementById(`field-${invalid}`)?.focus(); return; }
    const { error } = await supabase().from('profiles').update({
      full_name: form.values.full_name.trim().replace(/\s+/g, ' '),
      phone: formatPhone(form.values.phone),
    }).eq('id', profile.id);
    setMessage(error ? { ok: false, text: errorText(error) } : { ok: true, text: 'บันทึกข้อมูลแล้ว' });
    if (!error) await onSaved();
  };

  return <form className="ip-card ip-form" onSubmit={save} noValidate>
    <h2>ข้อมูลติดต่อ</h2>
    <label>อีเมล<input value={profile.email} disabled readOnly /></label>
    <ValidatedField label="ชื่อ-นามสกุล" {...form.fieldProps('full_name')} autoComplete="name" maxLength={120} />
    <ValidatedField label="เบอร์โทรศัพท์มือถือ" {...form.fieldProps('phone')} transform={sanitizePhone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={16} hint="ตัวเลข 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09" />
    {message && <p className={message.ok ? 'ip-success' : 'ip-error'}>{message.text}</p>}
    <button className="ip-btn" type="submit">บันทึกข้อมูล</button>
  </form>;
}

function PasswordForm() {
  const [message, setMessage] = useState<Message>(null);
  const form = useValidatedForm(passwordInitial, passwordValidators);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { document.getElementById(`field-${invalid}`)?.focus(); return; }
    const { error } = await supabase().auth.updateUser({ password: form.values.password });
    setMessage(error ? { ok: false, text: errorText(error) } : { ok: true, text: 'เปลี่ยนรหัสผ่านแล้ว' });
    if (!error) form.reset();
  };

  return <form className="ip-card ip-form" onSubmit={save} noValidate>
    <h2>เปลี่ยนรหัสผ่าน</h2>
    <ValidatedField label="รหัสผ่านใหม่" {...form.fieldProps('password')} type="password" autoComplete="new-password" maxLength={72} hint={<PasswordChecklist value={form.values.password} />} />
    <ValidatedField label="ยืนยันรหัสผ่านใหม่" {...form.fieldProps('confirm')} type="password" autoComplete="new-password" maxLength={72} />
    {message && <p className={message.ok ? 'ip-success' : 'ip-error'}>{message.text}</p>}
    <button className="ip-btn" type="submit">เปลี่ยนรหัสผ่าน</button>
  </form>;
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  if (!profile) return null;
  return <>
    <div className="ip-page-head"><div><p className="ip-eyebrow">PROFILE</p><h1>ข้อมูลส่วนตัว</h1></div></div>
    <div className="ip-two-col">
      <ContactForm key={profile.id} profile={profile} onSaved={refreshProfile} />
      <PasswordForm />
    </div>
  </>;
}
