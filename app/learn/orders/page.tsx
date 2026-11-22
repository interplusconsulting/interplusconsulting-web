'use client';

import PaginatedList from '../../_portal/paginated-list';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { errorText, formatBaht, formatDate, supabase } from '../../../lib/supabase';
import { orderStatusText, type Order } from '../../../lib/types';
import { Loading } from '../../_portal/shell';

type Row = Order & { courses: { title: string } | null };

export default function MyOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [examTitles, setExamTitles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!profile) return;
    supabase().from('orders').select('*, courses(title)').eq('user_id', profile.id).order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => { if (loadError) setError(errorText(loadError)); else setOrders(data as Row[]); });
    // Exam details are only readable through the catalog function.
    supabase().rpc('exam_catalog').then(({ data }) => setExamTitles(new Map(((data as { id: string; title: string }[] | null) ?? []).map(exam => [exam.id, exam.title]))));
  }, [profile]);

  const itemTitle = (order: Row) => order.exam_id ? `ข้อสอบ: ${examTitles.get(order.exam_id) ?? '-'}` : `คอร์ส: ${order.courses?.title ?? '-'}`;
  const retryHref = (order: Row) => order.exam_id ? `/learn/exam?id=${order.exam_id}` : `/learn/course?id=${order.course_id}`;

  return <>
    <div className="ip-page-head"><div><p className="ip-eyebrow">ORDERS</p><h1>คำสั่งซื้อของฉัน</h1><p className="ip-muted">ติดตามสถานะการตรวจสอบสลิป</p></div></div>
    {error && <p className="ip-error">{error}</p>}
    {!orders && !error && <Loading />}
    {orders && orders.length === 0 && <div className="ip-empty"><h2>ยังไม่มีคำสั่งซื้อ</h2><Link className="ip-btn" href="/learn/courses">เลือกคอร์สเรียน</Link></div>}
    <PaginatedList items={orders ?? []}>{pageItems => <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>รายการ</th><th>ยอดเงิน</th><th>วันที่ส่ง</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead>
      <tbody>{pageItems.map(order => <tr key={order.id}>
        <td data-label="รายการ">{itemTitle(order)}</td>
        <td data-label="ยอดเงิน">{formatBaht(order.amount)}</td>
        <td data-label="วันที่ส่ง">{formatDate(order.created_at)}</td>
        <td data-label="สถานะ"><span className={`ip-status ${order.status}`}>{orderStatusText[order.status]}</span></td>
        <td data-label="หมายเหตุ">{order.status === 'rejected' ? <>{order.note || '-'} <Link href={retryHref(order)}>ส่งสลิปใหม่</Link></> : order.note || '-'}</td>
      </tr>)}</tbody>
    </table></div>}</PaginatedList>
  </>;
}
