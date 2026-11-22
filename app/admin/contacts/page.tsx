'use client';

import PaginatedList from '../../_portal/paginated-list';
import { useCallback, useEffect, useState } from 'react';
import { errorText, formatDate, supabase } from '../../../lib/supabase';
import { Loading } from '../../_portal/shell';

type ContactStatus = 'new' | 'contacted' | 'closed';
type ContactRequest = { id: string; name: string; phone: string; email: string; service: string; message: string; source: string; status: ContactStatus; note: string; created_at: string };

const statusText: Record<ContactStatus, string> = { new: 'ใหม่', contacted: 'ติดต่อแล้ว', closed: 'ปิดเรื่อง' };
const statusClass: Record<ContactStatus, string> = { new: 'pending', contacted: 'admin', closed: 'approved' };
const filters: (ContactStatus | 'all')[] = ['new', 'contacted', 'closed', 'all'];

export default function AdminContactsPage() {
  const [filter, setFilter] = useState<ContactStatus | 'all'>('new');
  const [items, setItems] = useState<ContactRequest[] | null>(null);
  const [selected, setSelected] = useState<ContactRequest | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    let query = supabase().from('contact_requests').select('*').order('created_at', { ascending: false }).limit(300);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error: loadError } = await query;
    if (loadError) setError(errorText(loadError));
    setItems((data as ContactRequest[]) ?? []);
  }, [filter]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const update = async (status: ContactStatus) => {
    if (!selected) return;
    const { error: updateError } = await supabase().from('contact_requests').update({ status, note: note.trim().slice(0, 1000) }).eq('id', selected.id);
    if (updateError) { setError(errorText(updateError)); return; }
    setSelected(null);
    await load();
  };

  return <>
    <div className="ip-page-head"><div><h1>ผู้ติดต่อจากเว็บไซต์</h1><p className="ip-muted">ข้อมูลจากฟอร์ม “ส่งข้อมูลให้ที่ปรึกษา” บนหน้าเว็บ</p></div></div>
    <div className="ip-tabs" role="tablist">{filters.map(item => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} onClick={() => { setItems(null); setFilter(item); }}>{item === 'all' ? 'ทั้งหมด' : statusText[item]}</button>)}</div>
    {error && <p className="ip-error">{error}</p>}
    {!items && <Loading />}
    {items && items.length === 0 && <div className="ip-empty"><h2>ไม่มีรายการ</h2></div>}
    <PaginatedList items={items ?? []} resetKey={filter}>{pageItems => <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>ชื่อ</th><th>ติดต่อ</th><th>บริการที่สนใจ</th><th>วันที่</th><th>สถานะ</th><th /></tr></thead>
      <tbody>{pageItems.map(item => <tr key={item.id}>
        <td data-label="ชื่อ"><b>{item.name}</b></td>
        <td data-label="ติดต่อ"><a href={`tel:${item.phone.replace(/\D/g, '')}`}>{item.phone}</a><br /><small className="ip-muted">{item.email}</small></td>
        <td data-label="บริการที่สนใจ">{item.service || '-'}</td>
        <td data-label="วันที่">{formatDate(item.created_at)}</td>
        <td data-label="สถานะ"><span className={`ip-status ${statusClass[item.status]}`}>{statusText[item.status]}</span></td>
        <td><button type="button" className="ip-btn small" onClick={() => { setSelected(item); setNote(item.note); }}>เปิดดู</button></td>
      </tr>)}</tbody>
    </table></div>}</PaginatedList>

    {selected && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="ip-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title">
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setSelected(null)}>×</button>
        <h2 id="contact-title">{selected.name}</h2>
        <dl className="ip-bank">
          <dt>เบอร์โทร</dt><dd><a href={`tel:${selected.phone.replace(/\D/g, '')}`}>{selected.phone}</a></dd>
          <dt>อีเมล</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd>
          <dt>บริการ</dt><dd>{selected.service || '-'}</dd>
          <dt>ส่งจากหน้า</dt><dd>{selected.source || '-'}</dd>
          <dt>วันที่</dt><dd>{formatDate(selected.created_at)}</dd>
        </dl>
        <h3>รายละเอียด</h3>
        <p className="ip-prose">{selected.message || '-'}</p>
        <div className="ip-form">
          <label>บันทึกของแอดมิน<textarea rows={3} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} placeholder="เช่น โทรแล้ว นัดคุยวันเสาร์" /></label>
          <div className="ip-row">
            <button type="button" className="ip-btn small" onClick={() => void update('contacted')}>บันทึก: ติดต่อแล้ว</button>
            <button type="button" className="ip-btn small ghost" onClick={() => void update('closed')}>ปิดเรื่อง</button>
            {selected.status !== 'new' && <button type="button" className="ip-link-btn" onClick={() => void update('new')}>ย้อนกลับเป็น “ใหม่”</button>}
          </div>
        </div>
      </section>
    </div>}
  </>;
}
