'use client';

import PaginatedList from '../../_portal/paginated-list';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { errorText, supabase } from '../../../lib/supabase';
import type { DbAnnouncement } from '../../../lib/types';
import { AdminListHeading, IconButton, ImageField, SaveBar, StatusPill, NumberInput, PublishSwitch } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

const blank: Omit<DbAnnouncement, 'id'> = { label: '', title: '', description: '', details: [], image_url: '', gallery: [], is_published: true, position: 0 };

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<DbAnnouncement[] | null>(null);
  const [editing, setEditing] = useState<(Omit<DbAnnouncement, 'id'> & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase().from('announcements').select('*').order('position').order('created_at', { ascending: false });
    if (loadError) setError(errorText(loadError));
    setItems((data as DbAnnouncement[]) ?? []);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editing.image_url.trim()) { setMessage({ ok: false, text: 'กรุณาใส่รูปประกาศ' }); return; }
    setBusy(true); setMessage(null);
    const gallery = editing.gallery.filter(Boolean);
    const row = {
      label: editing.label.trim(), title: editing.title.trim(), description: editing.description.trim(),
      details: editing.details.map(line => line.trimEnd()).filter(Boolean), image_url: editing.image_url.trim(),
      gallery: gallery.length ? gallery : [editing.image_url.trim()], is_published: editing.is_published, position: Number(editing.position) || 0,
    };
    const db = supabase().from('announcements');
    const { error: saveError } = editing.id ? await db.update(row).eq('id', editing.id) : await db.insert(row);
    setBusy(false);
    if (saveError) { setMessage({ ok: false, text: errorText(saveError) }); return; }
    setEditing(null);
    await load();
  };

  const remove = async (item: DbAnnouncement) => {
    if (!window.confirm(`ลบประกาศ “${item.title}” ใช่ไหม? ลบแล้วกู้คืนไม่ได้ (ถ้าแค่ต้องการซ่อน ให้ปิด “แสดงบนเว็บ” แทน)`)) return;
    const { error: deleteError } = await supabase().from('announcements').delete().eq('id', item.id);
    if (deleteError) { setError(errorText(deleteError)); return; }
    await load();
  };

  const togglePublished = async (item: DbAnnouncement) => {
    const { error: updateError } = await supabase().from('announcements').update({ is_published: !item.is_published }).eq('id', item.id);
    if (updateError) setError(errorText(updateError)); else await load();
  };

  return <>
    <div className="ip-page-head"><div><h1>จัดการประกาศ</h1><p className="ip-muted">ประกาศที่แสดงบนหน้าแรก (ป๊อปอัปและส่วน “ข่าวสารและประกาศล่าสุด”) เรียงตามลำดับจากน้อยไปมาก</p></div>
      <button type="button" className="ip-btn" onClick={() => { setMessage(null); setEditing({ ...blank, position: items?.length ?? 0 }); }}>+ เพิ่มประกาศ</button></div>
    {error && <p className="ip-error">{error}</p>}
    {!items && <Loading />}
    {items && items.length === 0 && <div className="ip-empty"><h2>ยังไม่มีประกาศ</h2><p>หน้าแรกจะแสดงประกาศชุดเดิมที่ติดมากับเว็บจนกว่าจะเพิ่มประกาศที่นี่</p></div>}
    {!!items?.length && <AdminListHeading title="รายการประกาศ" count={items.length} />}
    <PaginatedList items={items ?? []}>{pageItems => <div className="ip-announce-grid">{pageItems.map(item => <article key={item.id} className="ip-card ip-announce">
      <img src={item.image_url} alt="" />
      <div>
        <div className="ip-row space"><small className="ip-eyebrow">#{item.position} · {item.label}</small><StatusPill on={item.is_published} onText="แสดงบนเว็บ" offText="ซ่อน" /></div>
        <h3>{item.title}</h3>
        <p className="ip-muted">{item.description}</p>
        <div className="admin-row-actions">
          <PublishSwitch checked={item.is_published} label={`เผยแพร่ประกาศ ${item.title}`} onToggle={() => togglePublished(item)} />
          <IconButton icon="edit" label="แก้ไข" onClick={() => { setMessage(null); setEditing(item); }} />
          <IconButton icon="delete" label="ลบ" tone="danger" onClick={() => void remove(item)} />
        </div>
      </div>
    </article>)}</div>}</PaginatedList>

    {editing && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}>
      <form className="ip-modal wide ip-form" role="dialog" aria-modal="true" aria-labelledby="announce-title" onSubmit={save}>
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setEditing(null)}>×</button>
        <h2 id="announce-title">{editing.id ? 'แก้ไขประกาศ' : 'เพิ่มประกาศ'}</h2>
        <div className="ip-form-row">
          <label>ป้ายกำกับ (เช่น PRIVATE TOUR · นครพนม)<input value={editing.label} onChange={event => setEditing({ ...editing, label: event.target.value })} maxLength={120} required /></label>
          <label>ลำดับ<NumberInput value={Number(editing.position)} onChange={value => setEditing({ ...editing, position: value })} /></label>
        </div>
        <label>หัวข้อ<input value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} maxLength={240} required /></label>
        <label>คำอธิบายสั้น<textarea rows={3} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} maxLength={1200} /></label>
        <ImageField label="รูปประกาศหลัก" value={editing.image_url} folder="announcements" onChange={image_url => setEditing({ ...editing, image_url })} />
        <div className="ip-image-field">
          <span className="ip-label">รูปเพิ่มเติมในหน้ารายละเอียด (ไม่ใส่ = ใช้รูปหลัก)</span>
          <div className="ip-images-admin">{editing.gallery.map((src, index) => <figure key={`${src}-${index}`}><img src={src} alt="" /><button type="button" aria-label="ลบรูป" onClick={() => setEditing({ ...editing, gallery: editing.gallery.filter((_, i) => i !== index) })}>×</button></figure>)}</div>
          <ImageField label="เพิ่มรูป" value="" folder="announcements" onChange={url => { if (url) setEditing({ ...editing, gallery: [...editing.gallery, url] }); }} />
        </div>
        <label>รายละเอียด (หนึ่งย่อหน้าต่อบรรทัด ขึ้นต้นด้วย • เป็นรายการ, # เป็นแท็ก)<textarea rows={8} value={editing.details.join('\n')} onChange={event => setEditing({ ...editing, details: event.target.value.split('\n') })} /></label>
        <PublishSwitch showLabel label="แสดงบนเว็บ" checked={editing.is_published}
          onToggle={() => setEditing({ ...editing, is_published: !editing.is_published })} />
        <SaveBar busy={busy} message={message} />
      </form>
    </div>}
  </>;
}
