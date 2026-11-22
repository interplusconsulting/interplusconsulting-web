'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudentAccess } from '../../../lib/student-access';
import { errorText, supabase } from '../../../lib/supabase';
import type { CatalogExam } from '../../../lib/types';
import { ItemBadge, PriceTag } from '../../_site/item-badge';
import { Loading } from '../../_portal/shell';

type Filter = 'ทั้งหมด' | 'ทำได้เลย' | 'ยังไม่มีสิทธิ์';

export default function ExamLibraryPage() {
  const access = useStudentAccess();
  const [exams, setExams] = useState<CatalogExam[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('ทั้งหมด');
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase().rpc('exam_catalog');
    if (loadError) setError(errorText(loadError));
    setExams((data as CatalogExam[]) ?? []);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const claim = async (exam: CatalogExam) => {
    setClaiming(exam.id); setError('');
    const { error: claimError } = await supabase().rpc('claim_free_exam', { p_exam: exam.id });
    setClaiming(null);
    if (claimError) { setError(errorText(claimError)); return; }
    access.refresh();
    await load();
  };

  const { asStudent } = access;
  const view = useMemo(() => (exams ?? []).map(asStudent), [exams, asStudent]);
  const hasLocked = view.some(exam => !exam.has_access);
  const shown = view.filter(exam => filter === 'ทั้งหมด' || (filter === 'ทำได้เลย' ? exam.has_access : !exam.has_access));
  const loading = !exams || !access.ready;

  return <>
    <div className="ip-page-head"><div><p className="ip-eyebrow">EXAMS</p><h1>คลังข้อสอบ</h1><p className="ip-muted">ชุดที่ฟรีกด “รับฟรี” ได้เลย ชุดที่มี 🔒 ต้องซื้อก่อน ข้อสอบที่มีสิทธิ์แล้วจะอยู่ในหน้า “คอร์สเรียนของฉัน” ด้วย</p></div></div>
    {hasLocked && <div className="ip-tabs" role="tablist">{(['ทั้งหมด', 'ทำได้เลย', 'ยังไม่มีสิทธิ์'] as Filter[]).map(item => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>}
    {error && <p className="ip-error">{error}</p>}
    {loading && !error && <Loading />}
    {!loading && shown.length === 0 && <div className="ip-empty"><h2>ไม่มีข้อสอบในหมวดนี้</h2></div>}
    {!loading && shown.length > 0 && <div className="ip-course-grid">{shown.map(exam => {
      const forSale = Number(exam.price) > 0;
      const freeToClaim = !forSale && !exam.course_id;
      return <article className={`ip-course-card ip-exam-card ${exam.has_access ? '' : 'locked'}`} key={exam.id}>
        <div className="ip-cover ip-exam-cover">
          {exam.cover_url ? <img src={exam.cover_url} alt="" /> : <span className="ip-exam-mark">{exam.title.match(/[A-Za-z]+/)?.[0]?.slice(0, 4).toUpperCase() ?? 'EXAM'}</span>}
          <ItemBadge badge={exam.badge} className="on-cover" />
          {exam.level && <em className="ip-badge">{exam.level}</em>}
          {!exam.has_access && !freeToClaim && <em className={`ip-badge ip-lock ${exam.pending_order ? 'pending' : ''}`}>{exam.pending_order ? 'รอตรวจสลิป' : '🔒 ต้องซื้อ'}</em>}
        </div>
        <div className="ip-course-body">
          <h3>{exam.title}</h3>
          {exam.description && <p>{exam.description}</p>}
          <div className="ip-exam-meta">
            {exam.question_count > 0 && <span>📝 {exam.question_count} ข้อ</span>}
            {exam.duration_min > 0 && <span>⏱ {exam.duration_min} นาที</span>}
            {freeToClaim && <span className="ip-free">ฟรี</span>}
          </div>
          {forSale && !exam.has_access && <strong className="ip-price"><PriceTag price={exam.price} compareAt={exam.compare_at_price} /></strong>}
          {!forSale && exam.course_id && !exam.has_access && <small className="ip-muted">รวมอยู่ในคอร์ส “{exam.course_title}”</small>}
          {exam.has_access
            ? <a className="ip-btn" href={exam.url} target="_blank" rel="noreferrer">เริ่มทำข้อสอบ ↗</a>
            : freeToClaim
              ? <button type="button" className="ip-btn" disabled={claiming === exam.id} onClick={() => void claim(exam)}>{claiming === exam.id ? 'กำลังรับ…' : 'รับฟรี'}</button>
              : <Link className="ip-btn" href={`/learn/exam?id=${exam.id}`}>{exam.pending_order ? 'ดูสถานะ' : forSale ? 'ซื้อข้อสอบ' : 'ดูวิธีรับสิทธิ์'}</Link>}
        </div>
      </article>;
    })}</div>}
    {shown.some(exam => exam.has_access && /gemini/.test(exam.url)) && <p className="ip-muted ip-small ip-exam-note">ข้อสอบที่สร้างด้วย Gemini จะมีหน้าต่างแจ้งเตือนก่อนเริ่ม ให้กด “Continue” เพื่อเข้าทำข้อสอบ</p>}
  </>;
}
