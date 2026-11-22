'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import { errorText, supabase } from '../../../lib/supabase';
import type { Course, Lesson } from '../../../lib/types';
import { BadgeSelect, IconButton, IconLink, ImageField, PriceEditor, SaveBar, StatusPill, NumberInput, PublishSwitch } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

type LessonRow = Pick<Lesson, 'id' | 'title' | 'position' | 'video_url' | 'pdf_path' | 'body' | 'quiz' | 'quiz_url'>;

function contentTags(lesson: LessonRow): string[] {
  return [lesson.video_url && 'วิดีโอ', lesson.body && 'ข้อความ', lesson.pdf_path && 'PDF', lesson.quiz.length && 'แบบทดสอบ', lesson.quiz_url && 'ลิงก์แบบทดสอบ'].filter(Boolean) as string[];
}

function CourseEditor() {
  const id = useSearchParams().get('id') ?? '';
  const router = useRouter();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const db = supabase();
    const [courseResult, lessonResult] = await Promise.all([
      db.from('courses').select('*').eq('id', id).maybeSingle(),
      db.from('lessons').select('id, title, position, video_url, pdf_path, body, quiz, quiz_url').eq('course_id', id).order('position').order('created_at'),
    ]);
    setCourse(courseResult.data as Course | null);
    setLessons((lessonResult.data as LessonRow[]) ?? []);
  }, [id]);

  useEffect(() => { if (id) void Promise.resolve().then(load); }, [id, load]);

  if (course === undefined) return <Loading />;
  if (!course) return <div className="ip-empty"><h2>ไม่พบคอร์ส</h2><Link className="ip-btn" href="/admin/courses">กลับ</Link></div>;

  const update = (patch: Partial<Course>) => setCourse({ ...course, ...patch });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const price = Number(course.price) || 0;
    const compareAt = Number(course.compare_at_price) || 0;
    if (compareAt > 0 && price >= compareAt) { setMessage({ ok: false, text: 'ราคาโปรโมชั่นต้องต่ำกว่าราคาปกติ' }); return; }
    setBusy(true); setMessage(null);
    const { error } = await supabase().from('courses').update({
      title: course.title.trim(), summary: course.summary, description: course.description,
      price, compare_at_price: compareAt, badge: course.badge || '', cover_url: course.cover_url.trim(), is_published: course.is_published,
      position: Number(course.position) || 0, updated_at: new Date().toISOString(),
    }).eq('id', course.id);
    setBusy(false);
    setMessage(error ? { ok: false, text: errorText(error) } : { ok: true, text: 'บันทึกแล้ว' });
  };

  const addLesson = async () => {
    const { data, error } = await supabase().from('lessons').insert({ course_id: course.id, title: `บทที่ ${lessons.length + 1}`, position: lessons.length }).select('id').single();
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    router.push(`/admin/lesson?id=${data.id}`);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const next = [...lessons];
    [next[index], next[target]] = [next[target], next[index]];
    const ordered = next.map((lesson, position) => ({ ...lesson, position }));
    setLessons(ordered);
    const db = supabase();
    const results = await Promise.all(ordered.map(lesson => db.from('lessons').update({ position: lesson.position }).eq('id', lesson.id)));
    const failed = results.find(result => result.error);
    if (failed?.error) setMessage({ ok: false, text: errorText(failed.error) });
  };

  const removeLesson = async (lesson: LessonRow) => {
    if (!window.confirm(`ลบบทเรียน “${lesson.title}” ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return;
    const { error } = await supabase().from('lessons').delete().eq('id', lesson.id);
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    if (lesson.pdf_path) await supabase().storage.from('lesson-files').remove([lesson.pdf_path]);
    await load();
  };

  const removeCourse = async () => {
    if (!window.confirm(`ลบคอร์ส “${course.title}” ทั้งบทเรียน คำสั่งซื้อ และสิทธิ์ของผู้เรียนใช่ไหม? ลบแล้วกู้คืนไม่ได้ (ถ้าแค่ต้องการซ่อน ให้ปิด “เผยแพร่” แทน)`)) return;
    const { error } = await supabase().from('courses').delete().eq('id', course.id);
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    router.replace('/admin/courses');
  };

  return <>
    <Link className="ip-back" href="/admin/courses">← คอร์สทั้งหมด</Link>
    <div className="ip-page-head"><div><h1>{course.title || 'คอร์สไม่มีชื่อ'}</h1></div><StatusPill on={course.is_published} /></div>
    <div className="ip-editor">
      <form className="ip-card ip-form" onSubmit={save}>
        <h2>ข้อมูลคอร์ส</h2>
        <label>ชื่อคอร์ส<input value={course.title} onChange={event => update({ title: event.target.value })} required maxLength={200} /></label>
        <label>คำอธิบายสั้น (แสดงบนการ์ด)<input value={course.summary} onChange={event => update({ summary: event.target.value })} maxLength={300} /></label>
        <label>รายละเอียดคอร์ส<textarea rows={6} value={course.description} onChange={event => update({ description: event.target.value })} /></label>
        <PriceEditor price={Number(course.price)} compareAt={Number(course.compare_at_price) || 0} zeroHint="ใส่ 0 = ฟรี (ผู้เรียนกดรับเอง)" onChange={update} />
        <div className="ip-form-row">
          <BadgeSelect value={course.badge || ''} onChange={badge => update({ badge })} />
          <label>ลำดับการแสดง<NumberInput value={Number(course.position)} onChange={value => update({ position: value })} /></label>
        </div>
        <ImageField label="รูปปกคอร์ส" value={course.cover_url} folder="courses" onChange={cover_url => update({ cover_url })} />
        <PublishSwitch showLabel label="เผยแพร่ (แสดงให้ผู้เรียนเห็นและซื้อได้)" checked={course.is_published}
          onToggle={() => update({ is_published: !course.is_published })} />
        <SaveBar busy={busy} message={message} />
        <button type="button" className="ip-link-btn danger" onClick={() => void removeCourse()}>ลบคอร์สนี้</button>
      </form>
      <section className="ip-card">
        <div className="ip-row space"><h2>บทเรียน ({lessons.length})</h2><button type="button" className="ip-btn small" onClick={() => void addLesson()}>+ เพิ่มบทเรียน</button></div>
        {lessons.length === 0 && <p className="ip-muted">ยังไม่มีบทเรียน</p>}
        <ol className="ip-lesson-admin">{lessons.map((lesson, index) => <li key={lesson.id}>
          <div className="ip-order-btns"><button type="button" aria-label="เลื่อนขึ้น" disabled={index === 0} onClick={() => void move(index, -1)}>↑</button><button type="button" aria-label="เลื่อนลง" disabled={index === lessons.length - 1} onClick={() => void move(index, 1)}>↓</button></div>
          <div className="ip-grow"><b>{index + 1}. {lesson.title}</b><div className="ip-tags">{contentTags(lesson).map(tag => <span key={tag}>{tag}</span>)}{!contentTags(lesson).length && <span className="empty">ยังไม่มีเนื้อหา</span>}</div></div>
          <div className="admin-row-actions">
            <IconLink icon="edit" label="แก้ไขบทเรียน" href={`/admin/lesson?id=${lesson.id}`} />
            <IconButton icon="delete" label="ลบบทเรียน" tone="danger" onClick={() => void removeLesson(lesson)} />
          </div>
        </li>)}</ol>
      </section>
    </div>
  </>;
}

export default function AdminCoursePage() {
  return <Suspense fallback={<Loading />}><CourseEditor /></Suspense>;
}
