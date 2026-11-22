'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { useStudentAccess } from '../../../lib/student-access';
import { errorText, formatBaht, formatDate, supabase } from '../../../lib/supabase';
import type { CatalogExam, Order } from '../../../lib/types';
import { ItemBadge, PriceTag } from '../../_site/item-badge';
import PurchaseBox from '../../_portal/purchase-box';
import { Loading } from '../../_portal/shell';

function ExamDetail() {
  const id = useSearchParams().get('id') ?? '';
  const { profile } = useAuth();
  const [rawExam, setExam] = useState<CatalogExam | null | undefined>(undefined);
  const access = useStudentAccess();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    if (!profile || !id) return;
    const [catalog, orderResult] = await Promise.all([
      supabase().rpc('exam_catalog'),
      supabase().from('orders').select('*').eq('user_id', profile.id).eq('exam_id', id).order('created_at', { ascending: false }),
    ]);
    setExam(((catalog.data as CatalogExam[] | null) ?? []).find(item => item.id === id) ?? null);
    setOrders((orderResult.data as Order[]) ?? []);
  }, [profile, id]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const claim = async () => {
    setClaiming(true); setClaimError('');
    const { error } = await supabase().rpc('claim_free_exam', { p_exam: id });
    setClaiming(false);
    if (error) { setClaimError(errorText(error)); return; }
    access.refresh();
    await load();
  };

  if (rawExam === undefined || !access.ready) return <Loading />;
  const exam = rawExam ? access.asStudent(rawExam) : null;
  if (!exam) return <div className="ip-empty"><h2>ไม่พบข้อสอบนี้</h2><Link className="ip-btn" href="/learn/exams">กลับไปคลังข้อสอบ</Link></div>;

  const pending = orders.find(order => order.status === 'pending');
  const lastRejected = orders.find(order => order.status === 'rejected');
  const forSale = Number(exam.price) > 0;

  return <>
    <Link className="ip-back" href="/learn/exams">← คลังข้อสอบ</Link>
    <div className="ip-detail">
      <div>
        <div className="ip-detail-cover ip-exam-cover">{exam.cover_url ? <img src={exam.cover_url} alt="" /> : <span className="ip-exam-mark">{exam.title.match(/[A-Za-z]+/)?.[0]?.slice(0, 4).toUpperCase() ?? 'EXAM'}</span>}</div>
        <h1>{exam.title}</h1>
        <div className="ip-exam-meta">
          {exam.level && <span>ระดับ {exam.level}</span>}
          {exam.question_count > 0 && <span>📝 {exam.question_count} ข้อ</span>}
          {exam.duration_min > 0 && <span>⏱ {exam.duration_min} นาที</span>}
        </div>
        {exam.description && <div className="ip-prose ip-exam-desc">{exam.description}</div>}
      </div>
      <aside className="ip-card ip-buy">
        <ItemBadge badge={exam.badge} />
        {forSale && <strong className="ip-price big"><PriceTag price={exam.price} compareAt={exam.compare_at_price} /></strong>}
        {exam.has_access ? <>
          <p className="ip-success">คุณมีสิทธิ์ทำข้อสอบชุดนี้แล้ว</p>
          <a className="ip-btn wide" href={exam.url} target="_blank" rel="noreferrer">เริ่มทำข้อสอบ ↗</a>
        </> : pending ? <>
          <p className="ip-notice">ได้รับสลิปของคุณแล้ว กำลังรอแอดมินตรวจสอบ เมื่ออนุมัติแล้วจะเริ่มทำข้อสอบได้ที่หน้า “คลังข้อสอบ”</p>
          <small className="ip-muted">ส่งเมื่อ {formatDate(pending.created_at)}</small>
          <Link className="ip-btn ghost wide" href="/learn/orders">ดูสถานะคำสั่งซื้อ</Link>
        </> : forSale ? <PurchaseBox item={{ examId: exam.id }} price={exam.price} lastRejectedNote={lastRejected ? lastRejected.note : null} onSent={load}>
          {exam.course_id && <p className="ip-muted ip-small">หรือซื้อคอร์ส “{exam.course_title}” เพื่อรับข้อสอบชุดนี้ด้วย <Link href={`/learn/course?id=${exam.course_id}`}>ดูคอร์ส</Link></p>}
        </PurchaseBox> : exam.course_id ? <>
          <p>ข้อสอบชุดนี้สำหรับผู้เรียนคอร์ส “{exam.course_title}”</p>
          <Link className="ip-btn wide" href={`/learn/course?id=${exam.course_id}`}>ดูคอร์ส{exam.course_price ? ` (${formatBaht(exam.course_price)})` : ''}</Link>
        </> : <>
          <strong className="ip-price big">ฟรี</strong>
          <p>กด “รับฟรี” แล้วข้อสอบจะไปอยู่ในหน้า “คอร์สเรียนของฉัน” และเริ่มทำได้ทันที</p>
          <button type="button" className="ip-btn wide" disabled={claiming} onClick={() => void claim()}>{claiming ? 'กำลังรับ…' : 'รับฟรี'}</button>
          {claimError && <p className="ip-error">{claimError}</p>}
        </>}
      </aside>
    </div>
  </>;
}

export default function ExamPage() {
  return <Suspense fallback={<Loading />}><ExamDetail /></Suspense>;
}
