'use client';

import PaginatedList from '../../_portal/paginated-list';
import { AdminListHeading, AdminSelect, IconButton } from '../../_portal/admin-ui';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { errorText, formatDate, supabase } from '../../../lib/supabase';
import type { Course, Profile, Role } from '../../../lib/types';
import { Loading } from '../../_portal/shell';
import { ValidatedField, useValidatedForm } from '../../_portal/validated-form';
import { formatPhone, sanitizePhone, validateEmail, validateFullName, validatePhone } from '../../../lib/validation';

type Enrollment = { course_id: string; created_at: string };

const infoValidators = { full_name: (value: string) => validateFullName(value), phone: (value: string) => validatePhone(value) };
const inviteValidators = { ...infoValidators, email: validateEmail };

function InviteUserForm({ onCancel, onInvited }: { onCancel: () => void; onInvited: (message: string, partial: boolean) => void }) {
  const { session } = useAuth();
  const form = useValidatedForm({ full_name: '', phone: '', email: '' }, inviteValidators);
  const [role, setRole] = useState<Role>('student');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { document.getElementById(`field-${invalid}`)?.focus(); return; }
    if (!session) { setError('กรุณาเข้าสู่ระบบใหม่'); return; }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ fullName: form.values.full_name, phone: form.values.phone, email: form.values.email, role }),
      });
      const result = await response.json() as { message?: string; partial?: boolean };
      if (!response.ok) {
        setError(result.message ?? 'ส่งคำเชิญไม่สำเร็จ');
        return;
      }
      onInvited(result.message ?? 'ส่งอีเมลเชิญแล้ว', result.partial === true);
    } catch {
      setError('เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return <form className="ip-card ip-form admin-invite-form" onSubmit={submit} noValidate>
    <div><h2>เพิ่มผู้ใช้</h2><p className="ip-muted">ระบบจะส่งลิงก์ให้ผู้ใช้ตั้งรหัสผ่านผ่านอีเมล</p></div>
    <div className="ip-form-row">
      <ValidatedField label="ชื่อ-นามสกุล" {...form.fieldProps('full_name')} autoComplete="off" maxLength={120} />
      <ValidatedField label="อีเมล" {...form.fieldProps('email')} type="email" autoComplete="off" maxLength={254} />
      <ValidatedField label="เบอร์โทรศัพท์มือถือ" {...form.fieldProps('phone')} transform={sanitizePhone} type="tel" inputMode="numeric" autoComplete="off" maxLength={16} />
      <AdminSelect label="บทบาท" value={role} options={[{ value: 'student', label: 'ผู้เรียน' }, { value: 'admin', label: 'แอดมิน' }]}
        onChange={value => setRole(value === 'admin' ? 'admin' : 'student')} />
    </div>
    {role === 'admin' && <p className="ip-notice ip-small">แอดมินจะเข้าถึงหลังบ้านและข้อมูลผู้ใช้ทั้งหมด</p>}
    {error && <p className="ip-error" role="alert">{error}</p>}
    <div className="ip-row">
      <button type="submit" className="ip-btn" disabled={busy}>{busy ? 'กำลังส่ง…' : 'ส่งอีเมลเชิญ'}</button>
      <button type="button" className="ip-btn ghost" disabled={busy} onClick={onCancel}>ยกเลิก</button>
    </div>
  </form>;
}

/** Admin edits a user's name and phone. Email changes need the user's own confirmation, so they are not editable here. */
function UserInfoForm({ user, onSaved }: { user: Profile; onSaved: (next: Profile) => void }) {
  const form = useValidatedForm({ full_name: user.full_name, phone: sanitizePhone(user.phone) }, infoValidators);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = form.validateAll();
    if (invalid) { document.getElementById(`field-${invalid}`)?.focus(); return; }
    const patch = { full_name: form.values.full_name.trim().replace(/\s+/g, ' '), phone: formatPhone(form.values.phone) };
    setBusy(true); setMessage(null);
    const { error } = await supabase().from('profiles').update(patch).eq('id', user.id);
    setBusy(false);
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    setMessage({ ok: true, text: 'บันทึกข้อมูลผู้ใช้แล้ว' });
    onSaved({ ...user, ...patch });
  };

  const sendReset = async () => {
    if (!window.confirm(`ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ ${user.email} ใช่ไหม?`)) return;
    const { error } = await supabase().auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    setResetSent(true);
    setMessage({ ok: true, text: `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ ${user.email} แล้ว` });
  };

  return <form className="ip-form" onSubmit={save} noValidate>
    <ValidatedField label="ชื่อ-นามสกุล" {...form.fieldProps('full_name')} autoComplete="off" maxLength={120} />
    <ValidatedField label="เบอร์โทรศัพท์มือถือ" {...form.fieldProps('phone')} transform={sanitizePhone} type="tel" inputMode="numeric" autoComplete="off" maxLength={16} hint="ตัวเลข 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09" />
    <label>อีเมล (ใช้เข้าสู่ระบบ)<input value={user.email} disabled readOnly /></label>
    <p className="ip-muted ip-small">อีเมลแก้จากหน้านี้ไม่ได้ เพราะต้องให้เจ้าของบัญชียืนยันทางอีเมล</p>
    {message && <p className={message.ok ? 'ip-success' : 'ip-error'} role="status">{message.text}</p>}
    <div className="ip-row">
      <button className="ip-btn small" type="submit" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}</button>
      <button className="ip-btn small ghost" type="button" disabled={resetSent} onClick={() => void sendReset()}>{resetSent ? 'ส่งลิงก์แล้ว' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}</button>
    </div>
  </form>;
}

export default function AdminUsersPage() {
  const { profile: me } = useAuth();
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grantCourse, setGrantCourse] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ text: string; partial: boolean } | null>(null);

  const load = useCallback(async () => {
    const db = supabase();
    const [userResult, courseResult] = await Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000),
      db.from('courses').select('*').order('position'),
    ]);
    setUsers((userResult.data as Profile[]) ?? []);
    setCourses((courseResult.data as Course[]) ?? []);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!users || !term) return users;
    return users.filter(user => [user.full_name, user.email, user.phone].some(value => value.toLowerCase().includes(term)));
  }, [users, search]);

  const open = async (user: Profile) => {
    setSelected(user); setMessage(null); setGrantCourse('');
    const { data } = await supabase().from('enrollments').select('course_id, created_at').eq('user_id', user.id);
    setEnrollments((data as Enrollment[]) ?? []);
  };

  const updateUser = async (patch: Partial<Pick<Profile, 'role' | 'is_active'>>, confirmText: string) => {
    if (!selected || !window.confirm(confirmText)) return;
    const { error } = await supabase().from('profiles').update(patch).eq('id', selected.id);
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    const next = { ...selected, ...patch };
    setSelected(next);
    setUsers(current => current?.map(user => (user.id === next.id ? next : user)) ?? null);
    setMessage({ ok: true, text: 'บันทึกแล้ว' });
  };

  const grant = async () => {
    if (!selected || !grantCourse) return;
    const { error } = await supabase().from('enrollments').insert({ user_id: selected.id, course_id: grantCourse });
    if (error) { setMessage({ ok: false, text: /duplicate key/i.test(error.message) ? 'ผู้ใช้มีคอร์สนี้แล้ว' : errorText(error) }); return; }
    setMessage({ ok: true, text: 'เพิ่มสิทธิ์เรียนแล้ว' });
    setGrantCourse('');
    await open(selected);
  };

  const revoke = async (courseId: string) => {
    if (!selected) return;
    const title = courses.find(course => course.id === courseId)?.title ?? 'คอร์สนี้';
    if (!window.confirm(`ยกเลิกสิทธิ์เรียน “${title}” ของ ${selected.full_name || selected.email} ใช่ไหม?`)) return;
    const { error } = await supabase().from('enrollments').delete().eq('user_id', selected.id).eq('course_id', courseId);
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    setMessage({ ok: true, text: 'ยกเลิกสิทธิ์แล้ว' });
    await open(selected);
  };

  const courseTitle = (id: string) => courses.find(course => course.id === id)?.title ?? '(คอร์สถูกลบ)';
  const isMe = selected?.id === me?.id;

  return <>
    <div className="ip-page-head">
      <div><h1>จัดการผู้ใช้</h1><p className="ip-muted">ดูข้อมูลผู้ใช้ เปลี่ยนสิทธิ์ ระงับบัญชี และเพิ่ม/ยกเลิกคอร์สให้ผู้เรียน</p></div>
      {!inviteOpen && <button type="button" className="ip-btn" onClick={() => { setInviteMessage(null); setInviteOpen(true); }}>+ เพิ่มผู้ใช้</button>}
    </div>
    {inviteOpen && <InviteUserForm onCancel={() => setInviteOpen(false)} onInvited={(text, partial) => {
      setInviteOpen(false);
      setInviteMessage({ text, partial });
      setSearch('');
      void load();
    }} />}
    {inviteMessage && <p className={inviteMessage.partial ? 'ip-notice' : 'ip-success'} role="status">{inviteMessage.text}</p>}
    <div className="admin-list-toolbar">
      {filtered && <AdminListHeading title="รายชื่อผู้ใช้" count={filtered.length} />}
      <input className="ip-search" type="search" placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร" value={search} onChange={event => setSearch(event.target.value)} aria-label="ค้นหาผู้ใช้" />
    </div>
    {!filtered && <Loading />}
    {filtered && filtered.length === 0 && <div className="ip-empty"><h2>ไม่พบผู้ใช้</h2></div>}
    <PaginatedList items={filtered ?? []} resetKey={search}>{pageItems => <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>ชื่อ</th><th>ติดต่อ</th><th>สิทธิ์</th><th>สถานะ</th><th>สมัครเมื่อ</th><th /></tr></thead>
      <tbody>{pageItems.map(user => <tr key={user.id}>
        <td data-label="ชื่อ"><b>{user.full_name || '-'}</b></td>
        <td data-label="ติดต่อ">{user.email}<br /><small className="ip-muted">{user.phone}</small></td>
        <td data-label="สิทธิ์"><span className={`ip-status ${user.role === 'admin' ? 'admin' : 'draft'}`}>{user.role === 'admin' ? 'แอดมิน' : 'ผู้เรียน'}</span></td>
        <td data-label="สถานะ"><span className={`ip-status ${user.is_active ? 'approved' : 'rejected'}`}>{user.is_active ? 'ใช้งาน' : 'ระงับ'}</span></td>
        <td data-label="สมัครเมื่อ">{formatDate(user.created_at)}</td>
        <td><div className="admin-row-actions"><IconButton icon="edit" label="แก้ไขผู้ใช้ (บทบาท สถานะ สิทธิ์คอร์ส)" onClick={() => void open(user)} /></div></td>
      </tr>)}</tbody>
    </table></div>}</PaginatedList>

    {selected && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="ip-modal" role="dialog" aria-modal="true" aria-labelledby="user-title">
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setSelected(null)}>×</button>
        <h2 id="user-title">{selected.full_name || selected.email}</h2>
        <p className="ip-muted ip-small">สมัครเมื่อ {formatDate(selected.created_at)}</p>

        <h3>ข้อมูลผู้ใช้</h3>
        <UserInfoForm key={selected.id} user={selected} onSaved={next => { setSelected(next); setUsers(current => current?.map(user => (user.id === next.id ? next : user)) ?? null); }} />

        <h3>สิทธิ์และสถานะ</h3>
        {isMe ? <p className="ip-muted">นี่คือบัญชีของคุณ เปลี่ยนสิทธิ์หรือระงับบัญชีตัวเองไม่ได้</p> : <div className="ip-row">
          {selected.role === 'admin'
            ? <button type="button" className="ip-btn small ghost" onClick={() => void updateUser({ role: 'student' }, `ถอดสิทธิ์แอดมินของ ${selected.email} ใช่ไหม?`)}>ถอดสิทธิ์แอดมิน</button>
            : <button type="button" className="ip-btn small ghost" onClick={() => void updateUser({ role: 'admin' }, `ตั้ง ${selected.email} เป็นแอดมินใช่ไหม? แอดมินจะเข้าถึงหลังบ้านและข้อมูลผู้ใช้ทั้งหมดได้`)}>ตั้งเป็นแอดมิน</button>}
          {selected.is_active
            ? <button type="button" className="ip-btn small danger" onClick={() => void updateUser({ is_active: false }, `ระงับบัญชี ${selected.email} ใช่ไหม? ผู้ใช้จะเข้าเรียนไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง`)}>ระงับบัญชี</button>
            : <button type="button" className="ip-btn small" onClick={() => void updateUser({ is_active: true }, `เปิดใช้งานบัญชี ${selected.email} อีกครั้งใช่ไหม?`)}>เปิดใช้งานบัญชี</button>}
        </div>}

        <h3>คอร์สที่มีสิทธิ์เรียน ({enrollments.length})</h3>
        {enrollments.length === 0 ? <p className="ip-muted">ยังไม่มีคอร์ส</p> : <ul className="ip-simple-list">{enrollments.map(item => <li key={item.course_id}>
          <span>{courseTitle(item.course_id)}<br /><small className="ip-muted">ตั้งแต่ {formatDate(item.created_at)}</small></span>
          <button type="button" className="ip-link-btn danger" onClick={() => void revoke(item.course_id)}>ยกเลิกสิทธิ์</button>
        </li>)}</ul>}
        <div className="ip-inline-form">
          <AdminSelect label="เพิ่มคอร์สให้ผู้ใช้ (ไม่ต้องผ่านการซื้อ)" value={grantCourse}
            options={[{ value: '', label: 'เลือกคอร์ส' }, ...courses.filter(course => !enrollments.some(item => item.course_id === course.id))
              .map(course => ({ value: course.id, label: course.title }))]}
            onChange={setGrantCourse} />
          <button type="button" className="ip-btn small" disabled={!grantCourse} onClick={() => void grant()}>เพิ่มสิทธิ์</button>
        </div>
        {message && <p className={message.ok ? 'ip-success' : 'ip-error'} role="status">{message.text}</p>}
      </section>
    </div>}
  </>;
}
