'use client';

import { useEffect, useState } from 'react';
import type { Announcement } from '../../../lib/announcement-data';

type Draft = Announcement & { id: string };

const emptyDraft = (): Draft => ({ id: '', label: '', title: '', description: '', image: '', fullImage: '', gallery: [], details: [] });

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [detailsText, setDetailsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    const response = await fetch('/api/local-announcements', { cache: 'no-store' });
    if (!response.ok) throw new Error('โหลดประกาศไม่สำเร็จ ตรวจว่ารันด้วย pnpm dev บน localhost');
    setItems(await response.json());
  };

  useEffect(() => {
    fetch('/api/local-announcements', { cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('โหลดประกาศไม่สำเร็จ'); return response.json(); })
      .then((data: Announcement[]) => setItems(data))
      .catch(error => setMessage(error.message));
  }, []);

  const select = (item?: Announcement) => {
    setDraft(item ? { ...item, gallery: [...item.gallery], details: [...item.details] } : emptyDraft());
    setDetailsText(item?.details.join('\n') ?? '');
    setMessage('');
  };

  const announceChange = () => {
    const channel = new BroadcastChannel('local-announcements');
    channel.postMessage('updated');
    channel.close();
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.gallery.length) { setMessage('กรุณาเพิ่มรูปประกาศอย่างน้อย 1 รูป'); return; }
    setBusy(true); setMessage('');
    try {
      const payload = { ...draft, image: draft.gallery[0], fullImage: draft.gallery[0], details: detailsText.split('\n').map(line => line.trim()).filter(Boolean) };
      const response = await fetch('/api/local-announcements', { method: draft.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'บันทึกไม่สำเร็จ');
      await refresh();
      select(result);
      setMessage('บันทึกแล้ว หน้าเว็บ local จะแสดงข้อมูลใหม่ทันที');
      announceChange();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (draft.gallery.length + files.length > 12) { setMessage('เพิ่มรูปได้สูงสุด 12 รูปต่อประกาศ'); return; }
    setBusy(true); setMessage('กำลังอัปโหลดรูป...');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData(); form.append('file', file);
        const response = await fetch('/api/local-announcements/upload', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'อัปโหลดไม่สำเร็จ');
        urls.push(result.url);
      }
      setDraft(current => ({ ...current, gallery: [...current.gallery, ...urls] }));
      setMessage(`อัปโหลด ${urls.length} รูปแล้ว กดบันทึกประกาศเพื่อใช้งาน`);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!draft.id || !window.confirm(`ลบประกาศ “${draft.title}” ใช่ไหม? (ไฟล์รูปจะยังอยู่ในโปรเจกต์)`)) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/local-announcements?id=${encodeURIComponent(draft.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('ลบประกาศไม่สำเร็จ');
      await refresh(); select(); setMessage('ลบประกาศแล้ว'); announceChange();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };

  const move = async (index: number, direction: number) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setBusy(true);
    try {
      const response = await fetch('/api/local-announcements', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next.map(item => item.id)) });
      if (!response.ok) throw new Error('เปลี่ยนลำดับไม่สำเร็จ');
      setItems(next); announceChange(); setMessage('เปลี่ยนลำดับแล้ว');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };

  return <main className="admin-page">
    <header className="admin-header"><div><p>LOCAL ONLY · ไม่ต้องล็อกอิน</p><h1>จัดการประกาศ</h1><span>เพิ่ม แก้ไข ลบรูปและรายละเอียดได้จากเครื่องนี้</span></div><a href="/#announcements" target="_blank" rel="noreferrer">เปิดหน้าเว็บ ↗</a></header>
    <div className="admin-layout">
      <aside className="admin-list"><div className="admin-list-header"><h2>ประกาศทั้งหมด ({items.length})</h2><button type="button" onClick={() => select()}>+ เพิ่มใหม่</button></div>
        {items.map((item, index) => <div className={`admin-list-item ${draft.id === item.id ? 'active' : ''}`} key={item.id}>
          <button type="button" className="admin-select" onClick={() => select(item)}><img src={item.image} alt="" /><span><b>{item.title}</b><small>{item.label}</small></span></button>
          <div className="admin-order"><button type="button" disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label={`เลื่อน ${item.title} ขึ้น`}>↑</button><button type="button" disabled={busy || index === items.length - 1} onClick={() => void move(index, 1)} aria-label={`เลื่อน ${item.title} ลง`}>↓</button></div>
        </div>)}
      </aside>
      <section className="admin-editor"><h2>{draft.id ? 'แก้ไขประกาศ' : 'เพิ่มประกาศใหม่'}</h2><p className="admin-hint">ข้อความแต่ละบรรทัดใน “รายละเอียด” จะแสดงเป็นย่อหน้าในป๊อปอัป</p>
        <form onSubmit={save}>
          <label>ป้ายหมวดหมู่<input value={draft.label} onChange={event => setDraft({ ...draft, label: event.target.value })} maxLength={120} required placeholder="เช่น PRIVATE TOUR · นครพนม–ท่าแขก" /></label>
          <label>หัวข้อประกาศ<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} maxLength={240} required /></label>
          <label>ข้อความสรุปบนการ์ด<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} maxLength={1200} rows={3} /></label>
          <label>รายละเอียดในป๊อปอัป<textarea value={detailsText} onChange={event => setDetailsText(event.target.value)} rows={9} placeholder="พิมพ์หนึ่งย่อหน้าต่อหนึ่งบรรทัด" /></label>
          <div className="admin-images"><div><b>รูปประกาศ</b><small>รูปแรกเป็นหน้าปก · เพิ่มได้สูงสุด 12 รูป · JPG, PNG, WebP ไม่เกิน 10 MB/รูป</small></div><label className="admin-upload">+ อัปโหลดรูป<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || draft.gallery.length >= 12} onChange={event => { void upload(event.target.files); event.target.value = ''; }} /></label></div>
          <div className="admin-gallery">{draft.gallery.map((url, index) => <div key={`${url}-${index}`}><img src={url} alt={`รูปประกาศ ${index + 1}`} /><span>{index === 0 ? 'หน้าปก' : `รูปที่ ${index + 1}`}</span>{index > 0 && <button type="button" onClick={() => setDraft(current => ({ ...current, gallery: [url, ...current.gallery.filter((_, position) => position !== index)] }))}>ตั้งเป็นหน้าปก</button>}<button type="button" onClick={() => setDraft(current => ({ ...current, gallery: current.gallery.filter((_, position) => position !== index) }))}>นำออก</button></div>)}</div>
          <div className="admin-actions"><button type="submit" disabled={busy}>{busy ? 'กำลังดำเนินการ...' : draft.id ? 'บันทึกการแก้ไข' : 'เพิ่มประกาศ'}</button>{draft.id && <button type="button" className="admin-delete" disabled={busy} onClick={() => void remove()}>ลบประกาศ</button>}</div>
          {message && <p className="admin-message" role="status">{message}</p>}
        </form>
      </section>
    </div>
  </main>;
}
