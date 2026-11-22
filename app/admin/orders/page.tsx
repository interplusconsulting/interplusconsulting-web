'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorText, formatBaht, formatDate, supabase } from '../../../lib/supabase';
import { orderStatusText, type Order, type OrderStatus } from '../../../lib/types';
import { Loading } from '../../_portal/shell';

type Row = Order & { courses: { title: string } | null; exams: { title: string } | null; profiles: { full_name: string; email: string; phone: string } | null };
const itemTitle = (order: Row) => order.exam_id ? `ข้อสอบ: ${order.exams?.title ?? '-'}` : `คอร์ส: ${order.courses?.title ?? '-'}`;
const filters: (OrderStatus | 'all')[] = ['pending', 'approved', 'rejected', 'all'];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | 'all'>('pending');
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [slipUrl, setSlipUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setOrders(null);
    let query = supabase().from('orders').select('*, courses(title), exams(title), profiles!orders_user_id_fkey(full_name, email, phone)').order('created_at', { ascending: false }).limit(200);
    if (status !== 'all') query = query.eq('status', status);
    const { data, error: loadError } = await query;
    if (loadError) { setError(errorText(loadError)); setOrders([]); return; }
    setOrders(data as Row[]);
  }, [status]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const open = async (order: Row) => {
    setSelected(order); setNote(order.note); setSlipUrl(''); setError('');
    const { data } = await supabase().storage.from('slips').createSignedUrl(order.slip_path, 60 * 10);
    setSlipUrl(data?.signedUrl ?? '');
  };

  const review = async (approve: boolean) => {
    if (!selected) return;
    if (!approve && !note.trim() && !window.confirm('ไม่อนุมัติโดยไม่ระบุเหตุผลใช่ไหม? ผู้เรียนจะเห็นหมายเหตุนี้')) return;
    setBusy(true); setError('');
    const { error: rpcError } = await supabase().rpc('review_order', { p_order: selected.id, p_approve: approve, p_note: note.trim() });
    setBusy(false);
    if (rpcError) { setError(errorText(rpcError)); return; }
    setSelected(null);
    await load();
  };

  const isPdf = selected?.slip_path.toLowerCase().endsWith('.pdf');

  return <>
    <div className="ip-page-head"><div><h1>ตรวจสลิปและคำสั่งซื้อ</h1><p className="ip-muted">อนุมัติแล้ว คอร์สจะไปแสดงในหน้า “คอร์สเรียนของฉัน” ของผู้เรียนทันที</p></div></div>
    <div className="ip-tabs" role="tablist">{filters.map(item => <button key={item} type="button" role="tab" aria-selected={status === item} className={status === item ? 'active' : ''} onClick={() => setStatus(item)}>{item === 'all' ? 'ทั้งหมด' : orderStatusText[item]}</button>)}</div>
    {!orders && <Loading />}
    {orders && orders.length === 0 && <div className="ip-empty"><h2>ไม่มีรายการ</h2></div>}
    {orders && orders.length > 0 && <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>ผู้ซื้อ</th><th>รายการ</th><th>ยอดเงิน</th><th>วันที่ส่ง</th><th>สถานะ</th><th /></tr></thead>
      <tbody>{orders.map(order => <tr key={order.id}>
        <td data-label="ผู้ซื้อ"><b>{order.profiles?.full_name || '-'}</b><br /><small className="ip-muted">{order.profiles?.email} {order.profiles?.phone}</small></td>
        <td data-label="รายการ">{itemTitle(order)}</td>
        <td data-label="ยอดเงิน">{formatBaht(order.amount)}</td>
        <td data-label="วันที่ส่ง">{formatDate(order.created_at)}</td>
        <td data-label="สถานะ"><span className={`ip-status ${order.status}`}>{orderStatusText[order.status]}</span></td>
        <td><button type="button" className="ip-btn small" onClick={() => void open(order)}>{order.status === 'pending' ? 'ตรวจสลิป' : 'ดู'}</button></td>
      </tr>)}</tbody>
    </table></div>}

    {selected && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="ip-modal wide" role="dialog" aria-modal="true" aria-labelledby="slip-title">
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setSelected(null)}>×</button>
        <h2 id="slip-title">สลิปการโอน</h2>
        <div className="ip-slip-layout">
          <div className="ip-slip">{!slipUrl ? <Loading text="กำลังโหลดสลิป…" /> : isPdf ? <a className="ip-btn" href={slipUrl} target="_blank" rel="noreferrer">เปิดสลิป (PDF) ↗</a> : <a href={slipUrl} target="_blank" rel="noreferrer"><img src={slipUrl} alt="สลิปการโอนเงิน" /></a>}</div>
          <div>
            <dl className="ip-bank">
              <dt>ผู้ซื้อ</dt><dd>{selected.profiles?.full_name}<br />{selected.profiles?.email}<br />{selected.profiles?.phone}</dd>
              <dt>รายการ</dt><dd>{itemTitle(selected)}</dd>
              <dt>ยอดที่ต้องโอน</dt><dd><b className="ip-amount-big">{formatBaht(selected.amount)}</b></dd>
              <dt>เลขอ้างอิงสลิป</dt><dd>{selected.slip_ref ? <code className="ip-ref">{selected.slip_ref}</code> : <span className="ip-muted">ไม่มี (คำสั่งซื้อก่อนเปิดระบบตรวจ QR)</span>}</dd>
              <dt>ส่งเมื่อ</dt><dd>{formatDate(selected.created_at)}</dd>
              <dt>สถานะ</dt><dd>{orderStatusText[selected.status]}</dd>
            </dl>
            {selected.status === 'pending' && <div className="ip-checklist">
              <strong>ก่อนกดอนุมัติ เปิดแอปธนาคารของร้านแล้วเช็กว่า</strong>
              <ul>
                <li>มีเงินเข้า <b>{formatBaht(selected.amount)}</b> พอดี (รวมเศษสตางค์)</li>
                <li>เวลาโอนตรงกับในสลิป และชื่อผู้โอนตรงกัน</li>
                {selected.slip_ref && <li>เลขอ้างอิงรายการในแอปธนาคารตรงกับ <code>{selected.slip_ref}</code></li>}
              </ul>
              <small>ระบบตรวจแล้วว่ารูปมี QR ของสลิปธนาคาร และสลิปใบนี้ไม่เคยถูกใช้ซ้ำ แต่ยืนยันไม่ได้ว่าเงินเข้าจริง</small>
            </div>}
            {selected.status === 'pending' ? <div className="ip-form">
              <label>หมายเหตุถึงผู้เรียน (ใส่เมื่อไม่อนุมัติ)<textarea rows={3} value={note} onChange={event => setNote(event.target.value)} maxLength={500} /></label>
              {error && <p className="ip-error">{error}</p>}
              <div className="ip-row"><button type="button" className="ip-btn" disabled={busy} onClick={() => void review(true)}>อนุมัติ เปิดสิทธิ์เรียน</button><button type="button" className="ip-btn danger" disabled={busy} onClick={() => void review(false)}>ไม่อนุมัติ</button></div>
            </div> : selected.note && <p className="ip-muted">หมายเหตุ: {selected.note}</p>}
          </div>
        </div>
      </section>
    </div>}
  </>;
}
