'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { useStudentAccess } from '../../../lib/student-access';
import { errorText, formatDate, supabase } from '../../../lib/supabase';
import { orderStatusText, type Course, type Order } from '../../../lib/types';
import { ItemBadge, PriceTag } from '../../_site/item-badge';
import PurchaseBox from '../../_portal/purchase-box';
import { Loading } from '../../_portal/shell';

type OutlineItem = { id: string; title: string; lesson_position: number };

function CourseDetail() {
  const id = useSearchParams().get('id') ?? '';
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [enrolled, setOwned] = useState(false);
  const access = useStudentAccess();
  // Admins in admin view can open any course; in student view they need to buy it like everyone else.
  const owned = enrolled || (profile?.role === 'admin' && !access.simulate);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    if (!profile || !id) return;
    const db = supabase();
    const [courseResult, outlineResult, enrollResult, orderResult] = await Promise.all([
      db.from('courses').select('*').eq('id', id).maybeSingle(),
      db.rpc('course_outline', { p_course: id }),
      db.from('enrollments').select('course_id').eq('user_id', profile.id).eq('course_id', id),
      db.from('orders').select('*').eq('user_id', profile.id).eq('course_id', id).order('created_at', { ascending: false }),
    ]);
    setCourse((courseResult.data as Course | null) ?? null);
    setOutline((outlineResult.data as OutlineItem[] | null) ?? []);
    setOwned((enrollResult.data ?? []).length > 0);
    setOrders((orderResult.data as Order[] | null) ?? []);
  }, [profile, id]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const claim = async () => {
    setClaiming(true); setClaimError('');
    const { error } = await supabase().rpc('claim_free_course', { p_course: id });
    setClaiming(false);
    if (error) { setClaimError(errorText(error)); return; }
    access.refresh();
    await load();
  };

  if (course === undefined) return <Loading />;
  if (!course) return <div className="ip-empty"><h2>ไม่พบคอร์สนี้</h2><Link className="ip-btn" href="/learn/courses">กลับไปหน้าคอร์สทั้งหมด</Link></div>;

  const pending = orders.find(order => order.status === 'pending');
  const lastRejected = orders.find(order => order.status === 'rejected');
  const isFree = Number(course.price) <= 0;

  return <>
    <Link className="ip-back" href="/learn/courses">← คอร์สทั้งหมด</Link>
    <div className="ip-detail">
      <div>
        <div className="ip-detail-cover">{course.cover_url ? <img src={course.cover_url} alt="" /> : <span>{course.title.slice(0, 1)}</span>}</div>
        <h1>{course.title}</h1>
        <p className="ip-lead">{course.summary}</p>
        {course.description && <div className="ip-prose">{course.description}</div>}
        <h2 className="ip-section-title">บทเรียนในคอร์ส ({outline.length})</h2>
        {outline.length ? <ol className="ip-outline">{outline.map(item => <li key={item.id}>{item.title}</li>)}</ol> : <p className="ip-muted">กำลังเตรียมบทเรียน</p>}
      </div>
      <aside className="ip-card ip-buy">
        <ItemBadge badge={course.badge} />
        <strong className="ip-price big"><PriceTag price={course.price} compareAt={course.compare_at_price} /></strong>
        {owned ? <>
          <p className="ip-success">คุณมีคอร์สนี้แล้ว</p>
          <Link className="ip-btn wide" href={`/learn/lesson?course=${course.id}`}>เข้าเรียน</Link>
        </> : pending ? <>
          <p className="ip-notice">{sent ? 'ส่งสลิปเรียบร้อยแล้ว' : 'ได้รับสลิปของคุณแล้ว'} กำลังรอแอดมินตรวจสอบ เมื่ออนุมัติแล้ว คอร์สจะไปแสดงที่หน้า “คอร์สเรียนของฉัน”</p>
          <small className="ip-muted">ส่งเมื่อ {formatDate(pending.created_at)}</small>
          <Link className="ip-btn ghost wide" href="/learn/orders">ดูสถานะคำสั่งซื้อ</Link>
        </> : isFree ? <>
          <p>คอร์สนี้เรียนฟรี กด “รับคอร์สฟรี” แล้วคอร์สจะไปอยู่ในหน้า “คอร์สเรียนของฉัน”</p>
          <button type="button" className="ip-btn wide" disabled={claiming} onClick={() => void claim()}>{claiming ? 'กำลังรับคอร์ส…' : 'รับคอร์สฟรี'}</button>
          {claimError && <p className="ip-error">{claimError}</p>}
        </> : <PurchaseBox item={{ courseId: course.id }} price={course.price} lastRejectedNote={lastRejected ? lastRejected.note : null} onSent={async () => { setSent(true); await load(); }} />}
      </aside>
    </div>
    {orders.length > 0 && <p className="ip-muted ip-small">สถานะล่าสุด: {orderStatusText[orders[0].status]}</p>}
  </>;
}

export default function CourseDetailPage() {
  return <Suspense fallback={<Loading />}><CourseDetail /></Suspense>;
}
