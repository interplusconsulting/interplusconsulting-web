'use client';

import PaginatedList from '../../_portal/paginated-list';
import { useCallback, useEffect, useState } from 'react';
import { errorText, formatBaht, formatDate, supabase } from '../../../lib/supabase';
import { orderStatusText, type Order, type OrderStatus } from '../../../lib/types';
import { Loading } from '../../_portal/shell';

type Row = Order & { courses: { title: string } | null; exams: { title: string } | null; profiles: { full_name: string; email: string; phone: string } | null };
const itemTitle = (order: Row) => order.exam_id ? `ข้อสอบ: ${order.exams?.title ?? '-'}` : `คอร์ส: ${order.courses?.title ?? '-'}`;
const filters: (OrderStatus | 'all')[] = ['pending', 'approved', 'rejected', 'all'];
const dateInBangkok = (date: string) => new Date(`${date}T00:00:00+07:00`);
const exportDate = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' });
const pageSize = 200;

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [slipUrl, setSlipUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const from = status === 'all' ? fromDate : '';
  const to = status === 'all' ? toDate : '';
  const invalidRange = Boolean(from && to && from > to);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted || invalidRange) return;
    setOrders(null);
    setError('');
    const rows: Row[] = [];
    const start = from ? dateInBangkok(from).toISOString() : '';
    const end = to ? new Date(dateInBangkok(to).getTime() + 86_400_000).toISOString() : '';
    for (let offset = 0; ; offset += pageSize) {
      let query = supabase().from('orders').select('*, courses(title), exams(title), profiles!orders_user_id_fkey(full_name, email, phone)')
        .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + pageSize - 1);
      if (status !== 'all') query = query.eq('status', status);
      if (start) query = query.gte('created_at', start);
      if (end) query = query.lt('created_at', end);
      if (signal) query = query.abortSignal(signal);
      const { data, error: loadError } = await query;
      if (signal?.aborted) return;
      if (loadError) { setError(errorText(loadError)); setOrders([]); return; }
      rows.push(...data as Row[]);
      if (status !== 'all' || data.length < pageSize) break;
    }
    setOrders(rows);
  }, [status, from, to, invalidRange]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

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
  const term = search.trim().toLocaleLowerCase('th');
  const phoneTerm = /^[+\d\s()\-]+$/.test(term) ? term.replace(/\D/g, '') : '';
  const visibleOrders = term ? orders?.filter(order => {
    const { full_name, email, phone } = order.profiles ?? {};
    return [full_name, email, phone, itemTitle(order), order.slip_ref, order.id].some(value => value?.toLocaleLowerCase('th').includes(term))
      || (phoneTerm !== '' && phone?.replace(/\D/g, '').includes(phoneTerm));
  }) : orders;

  const exportExcel = async () => {
    if (!visibleOrders?.length || exporting || invalidRange) return;
    setExporting(true);
    setExportError('');
    try {
      const { default: writeExcel } = await import('write-excel-file/browser');
      const headings = ['รหัสคำสั่งซื้อ', 'ผู้ซื้อ', 'อีเมล', 'เบอร์โทร', 'รายการ', 'ยอดเงิน (บาท)', 'วันที่ส่ง (เวลาไทย)', 'สถานะ', 'เลขอ้างอิงสลิป'];
      const rows = visibleOrders.map(order => [
        order.id, order.profiles?.full_name ?? '', order.profiles?.email ?? '', order.profiles?.phone ?? '',
        itemTitle(order), { value: Number(order.amount), format: '0.00' }, exportDate.format(new Date(order.created_at)),
        orderStatusText[order.status], order.slip_ref ?? '',
      ]);
      await writeExcel([headings.map(value => ({ value, fontWeight: 'bold' as const })), ...rows], {
        sheet: 'คำสั่งซื้อ', columns: [38, 24, 32, 17, 46, 15, 24, 22, 26].map(width => ({ width })),
        stickyRowsCount: 1,
      }).toFile('คำสั่งซื้อ.xlsx');
    } catch {
      setExportError('ส่งออกไฟล์ Excel ไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setExporting(false);
    }
  };

  return <>
    <div className="ip-page-head"><div><h1>ตรวจสลิปและคำสั่งซื้อ</h1><p className="ip-muted">อนุมัติแล้ว คอร์สจะไปแสดงในหน้า “คอร์สเรียนของฉัน” ของผู้เรียนทันที</p></div></div>
    <div className="admin-list-toolbar">
      <div className="ip-tabs admin-order-tabs" role="group" aria-label="สถานะคำสั่งซื้อ">
        {filters.map(item => <button key={item} type="button" aria-pressed={status === item}
          onClick={() => { if (status !== item) { setOrders(null); setStatus(item); } }}>
          {item === 'all' ? 'รายการทั้งหมด' : orderStatusText[item]}
        </button>)}
      </div>
      <input className="ip-search" type="search" aria-label="ค้นหาคำสั่งซื้อ"
        placeholder="ค้นหาผู้ซื้อ รายการ หรือเลขอ้างอิงสลิป" value={search} onChange={event => setSearch(event.target.value)} />
    </div>
    {status === 'all' && <div className="ip-card ip-inline-form admin-order-date-filter" aria-label="กรองตามวันที่ส่งสลิป" role="group">
      <label>วันที่ส่งตั้งแต่<input type="date" value={fromDate} max={toDate || undefined} onChange={event => { setOrders(null); setFromDate(event.target.value); }} /></label>
      <label>ถึงวันที่<input type="date" value={toDate} min={fromDate || undefined} onChange={event => { setOrders(null); setToDate(event.target.value); }} /></label>
      <button type="button" className="ip-btn ghost" disabled={!fromDate && !toDate} onClick={() => { setOrders(null); setFromDate(''); setToDate(''); }}>ล้างวันที่</button>
      <button type="button" className="ip-btn" disabled={!visibleOrders?.length || invalidRange || exporting} onClick={() => void exportExcel()}>
        {exporting ? 'กำลังส่งออก…' : 'ส่งออก Excel'}
      </button>
    </div>}
    {invalidRange && <p className="ip-error" role="alert">วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด</p>}
    {status === 'all' && exportError && <p className="ip-error" role="alert">{exportError}</p>}
    {!selected && error && <p className="ip-error" role="alert">{error}</p>}
    {!invalidRange && !visibleOrders && <Loading />}
    {!invalidRange && visibleOrders?.length === 0 && !error && <div className="ip-empty"><h2>{term || from || to ? 'ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง' : 'ไม่มีรายการ'}</h2></div>}
    <PaginatedList items={invalidRange ? [] : visibleOrders ?? []} resetKey={`${status}|${from}|${to}|${term}`}>{pageItems => <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>ผู้ซื้อ</th><th>รายการ</th><th>ยอดเงิน</th><th>วันที่ส่ง</th><th>สถานะ</th><th /></tr></thead>
      <tbody>{pageItems.map(order => <tr key={order.id}>
        <td data-label="ผู้ซื้อ"><b>{order.profiles?.full_name || '-'}</b><br /><small className="ip-muted">{order.profiles?.email} {order.profiles?.phone}</small></td>
        <td data-label="รายการ">{itemTitle(order)}</td>
        <td data-label="ยอดเงิน">{formatBaht(order.amount)}</td>
        <td data-label="วันที่ส่ง">{formatDate(order.created_at)}</td>
        <td data-label="สถานะ"><span className={`ip-status ${order.status}`}>{orderStatusText[order.status]}</span></td>
        <td>{order.status === 'pending'
          ? <button type="button" className="ip-btn small" onClick={() => void open(order)}>ตรวจสลิป</button>
          : <button type="button" className="ip-btn small ip-order-view-slip" aria-label="ดูสลิปการโอน" title="ดูสลิปการโอน" onClick={() => void open(order)}>
            <svg className="ip-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" />
            </svg>
          </button>}</td>
      </tr>)}</tbody>
    </table></div>}</PaginatedList>

    {selected && <div className="ip-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="ip-modal wide ip-order-slip-dialog" role="dialog" aria-modal="true" aria-labelledby="slip-title">
        <button type="button" className="ip-modal-close" aria-label="ปิด" onClick={() => setSelected(null)}>×</button>
        <header className="ip-order-slip-head">
          <h2 id="slip-title">สลิปการโอน</h2>
          <span className={`ip-status ${selected.status}`}>{orderStatusText[selected.status]}</span>
        </header>
        <div className="ip-slip-layout">
          <div className="ip-slip">{!slipUrl ? <Loading text="กำลังโหลดสลิป…" /> : isPdf ? <a className="ip-btn" href={slipUrl} target="_blank" rel="noreferrer">เปิดสลิป (PDF) ↗︎</a> : <a href={slipUrl} target="_blank" rel="noreferrer"><img src={slipUrl} alt="สลิปการโอนเงิน" /></a>}</div>
          <div className="ip-order-slip-details">
            <div className="ip-order-slip-amount">
              <span>ยอดที่ต้องโอน</span><strong>{formatBaht(selected.amount)}</strong>
            </div>
            <dl className="ip-bank ip-order-slip-facts">
              <dt>ผู้ซื้อ</dt><dd>{selected.profiles?.full_name}<br />{selected.profiles?.email}<br />{selected.profiles?.phone}</dd>
              <dt>รายการ</dt><dd>{itemTitle(selected)}</dd>
              <dt>เลขอ้างอิงสลิป</dt><dd>{selected.slip_ref ? <code className="ip-ref">{selected.slip_ref}</code> : <span className="ip-muted">ไม่มี (คำสั่งซื้อก่อนเปิดระบบตรวจ QR)</span>}</dd>
              <dt>ส่งเมื่อ</dt><dd>{formatDate(selected.created_at)}</dd>
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
            </div> : selected.note?.trim() && <section className="ip-order-slip-note" aria-label="หมายเหตุถึงผู้เรียน">
              <h3>หมายเหตุถึงผู้เรียน</h3>
              <p>{selected.note}</p>
            </section>}
          </div>
        </div>
      </section>
    </div>}
  </>;
}
