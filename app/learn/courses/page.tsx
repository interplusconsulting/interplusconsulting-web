'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { errorText, supabase } from '../../../lib/supabase';
import type { Course, OrderStatus } from '../../../lib/types';
import { ItemBadge, PriceTag } from '../../_site/item-badge';
import { Loading } from '../../_portal/shell';

export default function CourseStorePage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Map<string, OrderStatus>>(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const db = supabase();
      const [coursesResult, enrollResult, orderResult] = await Promise.all([
        db.from('courses').select('*').eq('is_published', true).order('position').order('created_at', { ascending: false }),
        db.from('enrollments').select('course_id').eq('user_id', profile.id),
        db.from('orders').select('course_id, status').eq('user_id', profile.id).in('status', ['pending', 'approved']),
      ]);
      if (coursesResult.error) { setError(errorText(coursesResult.error)); return; }
      setCourses(coursesResult.data as Course[]);
      setOwned(new Set((enrollResult.data ?? []).map(row => row.course_id)));
      setOrders(new Map((orderResult.data ?? []).map(row => [row.course_id, row.status as OrderStatus])));
    })();
  }, [profile]);

  return <>
    <div className="ip-page-head"><div><p className="ip-eyebrow">ALL COURSES</p><h1>คอร์สเรียนทั้งหมด</h1><p className="ip-muted">เลือกคอร์สที่สนใจ ชำระเงินด้วยการโอนและแนบสลิป แอดมินจะตรวจสอบและเปิดสิทธิ์ให้</p></div></div>
    {error && <p className="ip-error">{error}</p>}
    {!courses && !error && <Loading />}
    {courses && courses.length === 0 && <div className="ip-empty"><h2>ยังไม่มีคอร์สที่เปิดขาย</h2><p>ติดตามคอร์สใหม่เร็ว ๆ นี้</p></div>}
    {courses && courses.length > 0 && <div className="ip-course-grid">{courses.map(course => {
      const state = owned.has(course.id) ? 'owned' : orders.get(course.id) === 'pending' ? 'pending' : null;
      return <article className="ip-course-card" key={course.id}>
        <div className="ip-cover">{course.cover_url ? <img src={course.cover_url} alt="" /> : <span>{course.title.slice(0, 1)}</span>}
          <ItemBadge badge={course.badge} className="on-cover" />
          {state && <em className={`ip-badge ${state}`}>{state === 'owned' ? (Number(course.price) > 0 ? 'ซื้อแล้ว' : 'รับแล้ว') : 'รอตรวจสลิป'}</em>}</div>
        <div className="ip-course-body">
          <h3>{course.title}</h3>
          <p>{course.summary}</p>
          <strong className="ip-price"><PriceTag price={course.price} compareAt={course.compare_at_price} /></strong>
          {state === 'owned'
            ? <Link className="ip-btn" href={`/learn/lesson?course=${course.id}`}>เข้าเรียน</Link>
            : <Link className="ip-btn" href={`/learn/course?id=${course.id}`}>ดูรายละเอียด</Link>}
        </div>
      </article>;
    })}</div>}
  </>;
}
