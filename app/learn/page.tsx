'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { errorText, supabase } from '../../lib/supabase';
import type { CatalogExam, Course } from '../../lib/types';
import { Loading } from '../_portal/shell';

type MyCourse = Course & { lessonCount: number; doneCount: number };

/** Courses the member is enrolled in (bought or claimed free) and exams they can take. */
export default function MyCoursesPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<MyCourse[] | null>(null);
  const [exams, setExams] = useState<CatalogExam[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const db = supabase();
      const [enrollResult, examAccessResult, catalogResult] = await Promise.all([
        db.from('enrollments').select('course_id, courses(*)').eq('user_id', profile.id).order('created_at', { ascending: false }),
        db.from('exam_access').select('exam_id').eq('user_id', profile.id),
        db.rpc('exam_catalog'),
      ]);
      if (enrollResult.error) { setError(errorText(enrollResult.error)); return; }
      const list = (enrollResult.data ?? []).map(row => row.courses as unknown as Course).filter(Boolean);
      const courseIds = new Set(list.map(course => course.id));
      const examIds = new Set((examAccessResult.data ?? []).map(row => row.exam_id as string));
      // Based on the member's own claims/purchases (not admin rights), so admins see their own list too.
      setExams(((catalogResult.data as CatalogExam[] | null) ?? [])
        .filter(exam => examIds.has(exam.id) || (exam.course_id !== null && courseIds.has(exam.course_id))));

      const ids = [...courseIds];
      const [{ data: lessons }, { data: progress }] = await Promise.all([
        ids.length ? db.from('lessons').select('id, course_id').in('course_id', ids) : Promise.resolve({ data: [] as { id: string; course_id: string }[] }),
        db.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
      ]);
      const done = new Set((progress ?? []).map(row => row.lesson_id));
      setCourses(list.map(course => {
        const own = (lessons ?? []).filter(lesson => lesson.course_id === course.id);
        return { ...course, lessonCount: own.length, doneCount: own.filter(lesson => done.has(lesson.id)).length };
      }));
    })();
  }, [profile]);

  const empty = courses && courses.length === 0 && exams.length === 0;

  return <>
    <div className="ip-page-head">
      <div><p className="ip-eyebrow">MY COURSES</p><h1>คอร์สเรียนของฉัน</h1><p className="ip-muted">สวัสดี {profile?.full_name || profile?.email} คอร์สและข้อสอบที่ซื้อหรือรับฟรีแล้วอยู่ที่นี่</p></div>
      <div className="ip-row"><Link className="ip-btn ghost" href="/learn/exams">ดูข้อสอบทั้งหมด</Link><Link className="ip-btn" href="/learn/courses">ดูคอร์สทั้งหมด</Link></div>
    </div>
    {error && <p className="ip-error">{error}</p>}
    {!courses && !error && <Loading />}
    {empty && <div className="ip-empty">
      <h2>ยังไม่มีคอร์สหรือข้อสอบ</h2>
      <p>เลือกซื้อคอร์ส หรือกด “รับฟรี” ในคอร์สและข้อสอบที่ไม่มีค่าใช้จ่าย รายการจะมาแสดงที่หน้านี้</p>
      <div className="ip-row center"><Link className="ip-btn" href="/learn/courses">เลือกคอร์สเรียน</Link><Link className="ip-btn ghost" href="/learn/exams">ดูคลังข้อสอบ</Link></div>
    </div>}

    {courses && courses.length > 0 && <section className="ip-my-section">
      <h2 className="ip-section-title">คอร์สเรียน <small>{courses.length}</small></h2>
      <div className="ip-course-grid">{courses.map(course => {
        const percent = course.lessonCount ? Math.round((course.doneCount / course.lessonCount) * 100) : 0;
        return <article className="ip-course-card" key={course.id}>
          <div className="ip-cover">{course.cover_url ? <img src={course.cover_url} alt="" /> : <span>{course.title.slice(0, 1)}</span>}</div>
          <div className="ip-course-body">
            <h3>{course.title}</h3>
            <p>{course.summary}</p>
            <div className="ip-progress" aria-label={`เรียนแล้ว ${percent}%`}><span style={{ width: `${percent}%` }} /></div>
            <small>เรียนแล้ว {course.doneCount}/{course.lessonCount} บทเรียน</small>
            <Link className="ip-btn" href={`/learn/lesson?course=${course.id}`}>{course.doneCount ? 'เรียนต่อ' : 'เริ่มเรียน'}</Link>
          </div>
        </article>;
      })}</div>
    </section>}

    {courses && exams.length > 0 && <section className="ip-my-section">
      <h2 className="ip-section-title">ข้อสอบ <small>{exams.length}</small></h2>
      <div className="ip-course-grid">{exams.map(exam => <article className="ip-course-card ip-exam-card" key={exam.id}>
        <div className="ip-cover ip-exam-cover">
          {exam.cover_url ? <img src={exam.cover_url} alt="" /> : <span className="ip-exam-mark">{exam.title.match(/[A-Za-z]+/)?.[0]?.slice(0, 4).toUpperCase() ?? 'EXAM'}</span>}
          {exam.level && <em className="ip-badge">{exam.level}</em>}
        </div>
        <div className="ip-course-body">
          <h3>{exam.title}</h3>
          <div className="ip-exam-meta">
            {exam.question_count > 0 && <span>📝 {exam.question_count} ข้อ</span>}
            {exam.duration_min > 0 && <span>⏱ {exam.duration_min} นาที</span>}
          </div>
          {exam.url
            ? <a className="ip-btn" href={exam.url} target="_blank" rel="noreferrer">เริ่มทำข้อสอบ ↗</a>
            : <Link className="ip-btn" href={`/learn/exam?id=${exam.id}`}>ดูรายละเอียด</Link>}
        </div>
      </article>)}</div>
    </section>}
  </>;
}
