'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { useStudentAccess } from '../../../lib/student-access';
import { errorText, supabase } from '../../../lib/supabase';
import type { Course, Lesson } from '../../../lib/types';
import LessonContent from '../../_portal/lesson-content';
import { Loading } from '../../_portal/shell';

function LessonViewer() {
  const params = useSearchParams();
  const router = useRouter();
  const courseId = params.get('course') ?? '';
  const lessonId = params.get('lesson') ?? '';
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const access = useStudentAccess();

  useEffect(() => {
    if (!profile || !courseId) return;
    (async () => {
      const db = supabase();
      const [courseResult, lessonResult, progressResult, enrollResult] = await Promise.all([
        db.from('courses').select('*').eq('id', courseId).maybeSingle(),
        db.from('lessons').select('*').eq('course_id', courseId).order('position').order('created_at'),
        db.from('lesson_progress').select('lesson_id').eq('user_id', profile.id),
        db.from('enrollments').select('course_id').eq('user_id', profile.id).eq('course_id', courseId),
      ]);
      setEnrolled((enrollResult.data ?? []).length > 0);
      if (lessonResult.error) { setError(errorText(lessonResult.error)); return; }
      setCourse(courseResult.data as Course | null);
      setLessons(lessonResult.data as Lesson[]);
      setDone(new Set((progressResult.data ?? []).map(row => row.lesson_id)));
    })();
  }, [profile, courseId]);

  useEffect(() => { window.scrollTo(0, 0); }, [lessonId]);

  if (error) return <p className="ip-error">{error}</p>;
  if (!lessons || !access.ready) return <Loading />;
  // Members (and admins in student view) only get in with an enrollment; admins in admin view always can.
  const canView = enrolled || (profile?.role === 'admin' && !access.simulate);
  if (!canView) {
    return <div className="ip-empty"><h2>คุณยังไม่มีสิทธิ์เข้าเรียนคอร์สนี้</h2><p>ซื้อคอร์สก่อน เมื่อแอดมินอนุมัติแล้วจะเข้าเรียนได้ทันที</p><Link className="ip-btn" href={`/learn/course?id=${courseId}`}>ดูรายละเอียดคอร์ส</Link></div>;
  }
  if (!course || lessons.length === 0) {
    return <div className="ip-empty"><h2>{course ? 'คอร์สนี้ยังไม่มีบทเรียน' : 'คุณยังไม่มีสิทธิ์เข้าเรียนคอร์สนี้'}</h2><Link className="ip-btn" href={course ? '/learn' : `/learn/course?id=${courseId}`}>{course ? 'กลับคอร์สของฉัน' : 'ดูรายละเอียดคอร์ส'}</Link></div>;
  }

  const index = Math.max(0, lessons.findIndex(lesson => lesson.id === lessonId));
  const lesson = lessons[index];
  const go = (target: Lesson) => { setSidebarOpen(false); router.push(`/learn/lesson?course=${courseId}&lesson=${target.id}`); };

  const toggleDone = async () => {
    if (!profile) return;
    const db = supabase();
    const isDone = done.has(lesson.id);
    const { error: progressError } = isDone
      ? await db.from('lesson_progress').delete().eq('user_id', profile.id).eq('lesson_id', lesson.id)
      : await db.from('lesson_progress').upsert({ user_id: profile.id, lesson_id: lesson.id });
    if (progressError) { setError(errorText(progressError)); return; }
    setDone(current => { const next = new Set(current); if (isDone) next.delete(lesson.id); else next.add(lesson.id); return next; });
    if (!isDone && lessons[index + 1]) go(lessons[index + 1]);
  };

  return <div className="ip-classroom">
    <aside className={`ip-lesson-list ${sidebarOpen ? 'open' : ''}`}>
      <Link className="ip-back" href="/learn">← คอร์สของฉัน</Link>
      <h2>{course.title}</h2>
      <small className="ip-muted">เรียนแล้ว {lessons.filter(item => done.has(item.id)).length}/{lessons.length}</small>
      <ol>{lessons.map((item, i) => <li key={item.id}>
        <button type="button" className={item.id === lesson.id ? 'active' : ''} onClick={() => go(item)}>
          <span className={`ip-check ${done.has(item.id) ? 'done' : ''}`} aria-label={done.has(item.id) ? 'เรียนแล้ว' : 'ยังไม่ได้เรียน'}>{done.has(item.id) ? '✓' : i + 1}</span>{item.title}
        </button>
      </li>)}</ol>
    </aside>
    <section className="ip-lesson">
      <button type="button" className="ip-btn ghost small ip-lesson-menu" onClick={() => setSidebarOpen(open => !open)}>{sidebarOpen ? 'ซ่อนรายการบทเรียน' : 'รายการบทเรียน'}</button>
      <p className="ip-eyebrow">บทที่ {index + 1} จาก {lessons.length}</p>
      <h1>{lesson.title}</h1>
      <LessonContent lesson={lesson} />
      <div className="ip-lesson-nav">
        <button type="button" className="ip-btn ghost" disabled={index === 0} onClick={() => go(lessons[index - 1])}>← บทก่อนหน้า</button>
        <button type="button" className={`ip-btn ${done.has(lesson.id) ? 'ghost' : ''}`} onClick={() => void toggleDone()}>{done.has(lesson.id) ? 'เรียนแล้ว ✓ (ยกเลิก)' : 'เรียนจบบทนี้'}</button>
        <button type="button" className="ip-btn ghost" disabled={index === lessons.length - 1} onClick={() => go(lessons[index + 1])}>บทถัดไป →</button>
      </div>
    </section>
  </div>;
}

export default function LessonPage() {
  return <Suspense fallback={<Loading />}><LessonViewer /></Suspense>;
}
