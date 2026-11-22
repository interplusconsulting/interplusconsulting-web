'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { safeHttpUrl } from '../../../lib/media';
import { errorText, supabase } from '../../../lib/supabase';
import type { Review } from '../../../lib/types';
import { AdminListHeading, AdminSelect, IconButton, IconLink, SaveBar, StatusPill, NumberInput, PublishSwitch } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

type Draft = Omit<Review, 'id' | 'created_at'> & { id?: string };
const blank: Draft = { author_name: '', rating: 5, body: '', review_url: '', review_date: '', source: 'Google', is_published: true, position: 0 };

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase().from('reviews').select('*').order('position').order('created_at', { ascending: false });
    if (loadError) setError(errorText(loadError));
    setItems((data as Review[]) ?? []);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editing.author_name.trim() || !editing.body.trim()) { setMessage({ ok: false, text: 'กรุณากรอกชื่อผู้รีวิวและข้อความรีวิว' }); return; }
    if (editing.review_url.trim() && !safeHttpUrl(editing.review_url)) { setMessage({ ok: false, text: 'ลิงก์รีวิวต้องขึ้นต้นด้วย https://' }); return; }
    setBusy(true); setMessage(null);
    const row = {
      author_name: editing.author_name.trim(), rating: editing.rating, body: editing.body.trim(), review_url: editing.review_url.trim(),
      review_date: editing.review_date.trim(), source: editing.source.trim() || 'Google', is_published: editing.is_published, position: Number(editing.position) || 0,
    };
    const table = supabase().from('reviews');
    const { error: saveError } = editing.id ? await table.update(row).eq('id', editing.id) : await table.insert(row);
    setBusy(false);
    if (saveError) { setMessage({ ok: false, text: errorText(saveError) }); return; }
    setEditing(null);
    await load();
  };

  const togglePublished = async (item: Review) => {
    const { error: updateError } = await supabase().from('reviews').update({ is_published: !item.is_published }).eq('id', item.id);
    if (updateError) setError(errorText(updateError)); else await load();
  };

  const remove = async (item: Review) => {
    if (!window.confirm(`ลบรีวิวของ “${item.author_name}” ใช่ไหม? ลบแล้วกู้คืนไม่ได้ (ถ้าแค่ต้องการซ่อน ให้ปิดการเผยแพร่แทน)`)) return;
    const { error: deleteError } = await supabase().from('reviews').delete().eq('id', item.id);
    if (deleteError) setError(errorText(deleteError)); else await load();
  };

  return <>
    <div className="ip-page-head">
      <div><h1>จัดการรีวิว</h1><p className="ip-muted">คัดลอกรีวิวจริงจาก Google Maps มาใส่ หน้าเว็บจะแสดงเฉพาะรีวิว 5 ดาวที่ตั้งเป็น “แสดงบนเว็บ”</p></div>
      <button type="button" className="ip-btn" onClick={() => { setMessage(null); setEditing({ ...blank, position: items?.length ?? 0 }); }}>+ เพิ่มรีวิว</button>
    </div>
    <details className="ip-card ip-howto">
      <summary>วิธีคัดลอกรีวิวจาก Google Maps</summary>
      <ol>
        <li>เปิดหน้าร้านบน Google Maps แล้วไปที่แท็บ “รีวิว” เรียงตาม “คะแนนสูงสุด”</li>
        <li>คัดลอกชื่อผู้รีวิว ข้อความ และช่วงเวลา (เช่น “2 เดือนที่แล้ว”)</li>
        <li>กดปุ่ม “แชร์” ที่รีวิวนั้นเพื่อคัดลอกลิงก์ แล้ววางในช่อง “ลิงก์รีวิว” ผู้อ่านจะกดไปดูรีวิวจริงได้</li>
      </ol>
    </details>
    {error && <p className="ip-error">{error}</p>}
    {!items && <Loading />}
    {items && items.length === 0 && <div className="ip-empty"><h2>ยังไม่มีรีวิว</h2><p>กด “+ เพิ่มรีวิว” เพื่อเริ่ม</p></div>}
    {!!items?.length && <AdminListHeading title="รายการรีวิว" count={items.length} />}
    {items && items.length > 0 && <div className="ip-review-admin">{items.map(item => <article key={item.id} className="ip-card">
      <div className="ip-row space">
        <span className="review-stars" aria-label={`${item.rating} ดาว`}>{'★'.repeat(item.rating)}<span className="ip-stars-off">{'★'.repeat(5 - item.rating)}</span></span>
        <StatusPill on={item.is_published && item.rating === 5} onText="แสดงบนเว็บ" offText={item.rating < 5 ? 'ไม่แสดง (ต่ำกว่า 5 ดาว)' : 'ซ่อน'} />
      </div>
      <p className="ip-review-body">{item.body}</p>
      <p className="ip-muted ip-small"><b>{item.author_name}</b>{item.review_date && ` · ${item.review_date}`} · {item.source} · ลำดับ {item.position}</p>
      <div className="admin-row-actions">
        <PublishSwitch checked={item.is_published} label={`เปิดการเผยแพร่รีวิวของ ${item.author_name}`} onToggle={() => togglePublished(item)} />
        <IconButton icon="edit" label="แก้ไข" onClick={() => { setMessage(null); setEditing(item); }} />
        {item.review_url && <IconLink icon="open" label="ดูรีวิวต้นฉบับ" href={item.review_url} external />}
        <IconButton icon="delete" label="ลบ" tone="danger" onClick={() => void remove(item)} />
      </div>
    </article>)}</div>}

    {editing && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}>
      <form className="ip-modal wide ip-form" role="dialog" aria-modal="true" aria-labelledby="review-title" onSubmit={save}>
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setEditing(null)}>×</button>
        <h2 id="review-title">{editing.id ? 'แก้ไขรีวิว' : 'เพิ่มรีวิว'}</h2>
        <div className="ip-form-row">
          <label>ชื่อผู้รีวิว (ตามที่แสดงบน Google)<input value={editing.author_name} onChange={event => setEditing({ ...editing, author_name: event.target.value })} maxLength={120} required /></label>
          <AdminSelect label="คะแนน" value={String(editing.rating)}
            options={[5, 4, 3, 2, 1].map(value => ({ value: String(value), label: `${value} ดาว` }))}
            onChange={value => setEditing({ ...editing, rating: Number(value) })} />
        </div>
        <label>ข้อความรีวิว (คัดลอกตามต้นฉบับ)<textarea rows={6} value={editing.body} onChange={event => setEditing({ ...editing, body: event.target.value })} maxLength={3000} required /></label>
        <label>ลิงก์รีวิวบน Google Maps<input value={editing.review_url} onChange={event => setEditing({ ...editing, review_url: event.target.value })} placeholder="https://maps.app.goo.gl/…" maxLength={1000} /></label>
        <div className="ip-form-row">
          <label>ช่วงเวลา (เช่น 2 เดือนที่แล้ว)<input value={editing.review_date} onChange={event => setEditing({ ...editing, review_date: event.target.value })} maxLength={60} /></label>
          <label>ลำดับการแสดง<NumberInput value={Number(editing.position)} onChange={value => setEditing({ ...editing, position: value })} /></label>
        </div>
        <PublishSwitch showLabel label="แสดงบนเว็บ (เฉพาะรีวิว 5 ดาว)" checked={editing.is_published}
          onToggle={() => setEditing({ ...editing, is_published: !editing.is_published })} />
        <SaveBar busy={busy} message={message} />
      </form>
    </div>}
  </>;
}
