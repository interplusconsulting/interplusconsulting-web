'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { safeHttpUrl } from '../../../lib/media';
import { errorText, formatBaht, supabase } from '../../../lib/supabase';
import type { Course, Exam } from '../../../lib/types';
import { badgeLabel, isOnPromo } from '../../../lib/pricing';
import { AdminListHeading, AdminSelect, BadgeSelect, IconButton, IconLink, ImageField, PriceEditor, SaveBar, StatusPill, NumberInput, PublishSwitch } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

type Draft = Omit<Exam, 'id' | 'created_at'> & { id?: string };
const blank: Draft = { title: '', description: '', level: '', question_count: 0, duration_min: 0, url: '', cover_url: '', price: 0, compare_at_price: 0, badge: '', course_id: null, is_published: true, position: 0 };

export default function AdminExamsPage() {
  const [items, setItems] = useState<Exam[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const db = supabase();
    const [examResult, courseResult] = await Promise.all([
      db.from('exams').select('*').order('position').order('created_at', { ascending: false }),
      db.from('courses').select('*').order('position'),
    ]);
    if (examResult.error) setError(errorText(examResult.error));
    setItems((examResult.data as Exam[]) ?? []);
    setCourses((courseResult.data as Course[]) ?? []);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const url = safeHttpUrl(editing.url);
    if (!editing.title.trim()) { setMessage({ ok: false, text: 'กรุณาใส่ชื่อข้อสอบ' }); return; }
    if (!url || !url.startsWith('https://')) { setMessage({ ok: false, text: 'ลิงก์ข้อสอบต้องขึ้นต้นด้วย https://' }); return; }
    const price = Math.max(0, Number(editing.price) || 0);
    const compareAt = Math.max(0, Number(editing.compare_at_price) || 0);
    if (compareAt > 0 && price >= compareAt) { setMessage({ ok: false, text: 'ราคาโปรโมชั่นต้องต่ำกว่าราคาปกติ' }); return; }
    setBusy(true); setMessage(null);
    const row = {
      title: editing.title.trim(), description: editing.description.trim(), level: editing.level.trim(),
      question_count: Math.max(0, Number(editing.question_count) || 0), duration_min: Math.max(0, Number(editing.duration_min) || 0),
      url, cover_url: editing.cover_url.trim(), price, compare_at_price: compareAt, badge: editing.badge || '',
      course_id: editing.course_id || null, is_published: editing.is_published, position: Number(editing.position) || 0,
    };
    const table = supabase().from('exams');
    const { error: saveError } = editing.id ? await table.update(row).eq('id', editing.id) : await table.insert(row);
    setBusy(false);
    if (saveError) { setMessage({ ok: false, text: errorText(saveError) }); return; }
    setEditing(null);
    await load();
  };

  const togglePublished = async (item: Exam) => {
    const { error: updateError } = await supabase().from('exams').update({ is_published: !item.is_published }).eq('id', item.id);
    if (updateError) setError(errorText(updateError)); else await load();
  };

  const remove = async (item: Exam) => {
    if (!window.confirm(`ลบข้อสอบ “${item.title}” ออกจากคลังใช่ไหม? (ตัวข้อสอบบน Gemini ไม่ถูกลบ)`)) return;
    const { error: deleteError } = await supabase().from('exams').delete().eq('id', item.id);
    if (deleteError) setError(errorText(deleteError)); else await load();
  };

  const courseTitle = (id: string | null) => (id ? courses.find(course => course.id === id)?.title ?? '(คอร์สถูกลบ)' : '');
  const accessText = (item: Exam) => {
    const parts = [Number(item.price) > 0
      ? `ขาย ${formatBaht(item.price)}${isOnPromo(item.price, item.compare_at_price) ? ` (จาก ${formatBaht(item.compare_at_price)})` : ''}`
      : item.course_id ? '' : 'ฟรี (กดรับ)'];
    if (badgeLabel(item.badge)) parts.push(`ป้าย: ${badgeLabel(item.badge)}`);
    if (item.course_id) parts.push(`รวมในคอร์ส ${courseTitle(item.course_id)}`);
    return parts.filter(Boolean).join(' · ');
  };

  return <>
    <div className="ip-page-head">
      <div><h1>คลังข้อสอบ</h1><p className="ip-muted">ข้อสอบที่ทำผ่านลิงก์ภายนอก เช่น Gemini Canvas แสดงเป็นการ์ดในแท็บ “คลังข้อสอบ” ของผู้เรียน</p></div>
      <button type="button" className="ip-btn" onClick={() => { setMessage(null); setEditing({ ...blank, position: items?.length ?? 0 }); }}>+ เพิ่มข้อสอบ</button>
    </div>
    {error && <p className="ip-error">{error}</p>}
    {!items && <Loading />}
    {items && items.length === 0 && <div className="ip-empty"><h2>ยังไม่มีข้อสอบ</h2><p>กด “+ เพิ่มข้อสอบ” แล้ววางลิงก์ข้อสอบ</p></div>}
    {!!items?.length && <AdminListHeading title="รายการข้อสอบ" count={items.length} />}
    {items && items.length > 0 && <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>ข้อสอบ</th><th>รายละเอียด</th><th>ราคา / สิทธิ์</th><th>สถานะ</th><th /></tr></thead>
      <tbody>{items.map(item => <tr key={item.id}>
        <td data-label="ข้อสอบ"><b>{item.title}</b><br /><small className="ip-muted">{item.level}</small></td>
        <td data-label="รายละเอียด">{item.question_count ? `${item.question_count} ข้อ` : '-'}{item.duration_min ? ` · ${item.duration_min} นาที` : ''}</td>
        <td data-label="ราคา / สิทธิ์">{accessText(item)}</td>
        <td data-label="สถานะ"><StatusPill on={item.is_published} onText="แสดง" offText="ซ่อน" /></td>
        <td><div className="admin-row-actions">
          <PublishSwitch checked={item.is_published} label={`เผยแพร่ข้อสอบ ${item.title}`} onToggle={() => togglePublished(item)} />
          <IconButton icon="edit" label="แก้ไข" onClick={() => { setMessage(null); setEditing(item); }} />
          <IconLink icon="open" label="เปิดข้อสอบ" href={item.url} external />
          <IconButton icon="delete" label="ลบ" tone="danger" onClick={() => void remove(item)} />
        </div></td>
      </tr>)}</tbody>
    </table></div>}

    {editing && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}>
      <form className="ip-modal wide ip-form" role="dialog" aria-modal="true" aria-labelledby="exam-title" onSubmit={save}>
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setEditing(null)}>×</button>
        <h2 id="exam-title">{editing.id ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบ'}</h2>
        <label>ชื่อข้อสอบ<input value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} maxLength={200} required placeholder="เช่น KEPT X Mock Examination — Set 5" /></label>
        <label>ลิงก์ข้อสอบ (Gemini, Google Forms ฯลฯ)<input value={editing.url} onChange={event => setEditing({ ...editing, url: event.target.value })} required placeholder="https://share.gemini.google/…" /></label>
        <label>คำอธิบาย<textarea rows={3} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} maxLength={1000} /></label>
        <div className="ip-form-row">
          <label>ระดับ<input value={editing.level} onChange={event => setEditing({ ...editing, level: event.target.value })} maxLength={60} placeholder="เช่น B1–C1" /></label>
          <label>ลำดับการแสดง<NumberInput value={Number(editing.position)} onChange={value => setEditing({ ...editing, position: value })} /></label>
        </div>
        <div className="ip-form-row">
          <label>จำนวนข้อ<NumberInput value={Number(editing.question_count)} onChange={value => setEditing({ ...editing, question_count: value })} /></label>
          <label>เวลาทำ (นาที)<NumberInput value={Number(editing.duration_min)} onChange={value => setEditing({ ...editing, duration_min: value })} /></label>
        </div>
        <PriceEditor price={Number(editing.price)} compareAt={Number(editing.compare_at_price) || 0} zeroHint="ใส่ 0 = ไม่ขายแยก"
          onChange={next => setEditing({ ...editing, ...next })} />
        <div className="ip-form-row">
          <BadgeSelect value={editing.badge || ''} onChange={badge => setEditing({ ...editing, badge })} />
          <AdminSelect label="รวมอยู่ในคอร์ส (ผู้เรียนคอร์สนี้ทำได้ฟรี)" value={editing.course_id ?? ''}
            options={[{ value: '', label: 'ไม่ผูกกับคอร์ส' }, ...courses.map(course => ({ value: course.id, label: course.title }))]}
            onChange={value => setEditing({ ...editing, course_id: value || null })} />
        </div>
        <p className="ip-notice ip-small">{Number(editing.price) > 0
          ? `ผู้เรียนซื้อข้อสอบชุดนี้ได้ในราคา ${formatBaht(editing.price)}${editing.course_id ? ' หรือได้ฟรีเมื่อซื้อคอร์สที่เลือก' : ''} — คนที่ยังไม่ซื้อจะเห็นการ์ดแบบล็อก`
          : editing.course_id ? 'ไม่ขายแยก — เฉพาะผู้เรียนคอร์สที่เลือกทำได้ คนอื่นเห็นการ์ดล็อกพร้อมลิงก์ไปซื้อคอร์ส' : 'ฟรี — สมาชิกกด “รับฟรี” ก่อน แล้วข้อสอบจะไปอยู่ในหน้า “คอร์สเรียนของฉัน”'}</p>
        <ImageField label="รูปปก (ไม่ใส่ก็ได้)" value={editing.cover_url} folder="exams" onChange={cover_url => setEditing({ ...editing, cover_url })} />
        <PublishSwitch showLabel label="แสดงในคลังข้อสอบ" checked={editing.is_published}
          onToggle={() => setEditing({ ...editing, is_published: !editing.is_published })} />
        <SaveBar busy={busy} message={message} />
      </form>
    </div>}
  </>;
}
