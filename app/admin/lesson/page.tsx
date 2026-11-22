'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { safeHttpUrl, videoEmbedUrl } from '../../../lib/media';
import { errorText, safeFileName, supabase, uploadPublicImage } from '../../../lib/supabase';
import type { Lesson } from '../../../lib/types';
import LessonContent from '../../_portal/lesson-content';
import { SaveBar } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

type EditableQuestion = { question: string; choices: string[]; answer: number };

function LessonEditor() {
  const id = useSearchParams().get('id') ?? '';
  const [lesson, setLesson] = useState<Lesson | null | undefined>(undefined);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [savedPdf, setSavedPdf] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const db = supabase();
      const [lessonResult, keyResult] = await Promise.all([
        db.from('lessons').select('*').eq('id', id).maybeSingle(),
        db.from('quiz_keys').select('answers').eq('lesson_id', id).maybeSingle(),
      ]);
      const loaded = lessonResult.data as Lesson | null;
      setLesson(loaded);
      setSavedPdf(loaded?.pdf_path ?? '');
      const answers: number[] = keyResult.data?.answers ?? [];
      setQuestions((loaded?.quiz ?? []).map((item, index) => ({ ...item, answer: answers[index] ?? 0 })));
    })();
  }, [id]);

  if (lesson === undefined) return <Loading />;
  if (!lesson) return <div className="ip-empty"><h2>ไม่พบบทเรียน</h2><Link className="ip-btn" href="/admin/courses">กลับ</Link></div>;

  const update = (patch: Partial<Lesson>) => setLesson({ ...lesson, ...patch });
  const updateQuestion = (index: number, patch: Partial<EditableQuestion>) => setQuestions(current => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const uploadPdf = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setMessage({ ok: false, text: 'รองรับเฉพาะไฟล์ PDF' }); return; }
    if (file.size > 50 * 1024 * 1024) { setMessage({ ok: false, text: 'ไฟล์ PDF ต้องไม่เกิน 50 MB' }); return; }
    setUploading('pdf');
    const path = `${lesson.course_id}/${safeFileName(file.name)}`;
    const { error } = await supabase().storage.from('lesson-files').upload(path, file, { contentType: 'application/pdf' });
    setUploading('');
    if (error) { setMessage({ ok: false, text: errorText(error) }); return; }
    update({ pdf_path: path });
    setMessage({ ok: true, text: 'อัปโหลด PDF แล้ว กด “บันทึก” เพื่อยืนยัน' });
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading('images');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 10 * 1024 * 1024) continue;
        urls.push(await uploadPublicImage(file, `lessons/${lesson.course_id}`));
      }
      update({ image_urls: [...lesson.image_urls, ...urls] });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setUploading('');
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const cleanQuestions = questions
      .map(item => ({ ...item, question: item.question.trim(), choices: item.choices.map(choice => choice.trim()) }))
      .filter(item => item.question && item.choices.filter(Boolean).length >= 2);
    if (cleanQuestions.length !== questions.length) {
      setMessage({ ok: false, text: 'ทุกคำถามต้องมีข้อความ และมีตัวเลือกที่กรอกแล้วอย่างน้อย 2 ข้อ' });
      return;
    }
    if (cleanQuestions.some(item => !item.choices[item.answer])) {
      setMessage({ ok: false, text: 'กรุณาเลือกคำตอบที่ถูกต้องให้ครบทุกข้อ (และคำตอบต้องไม่เป็นช่องว่าง)' });
      return;
    }
    if (lesson.video_url && !videoEmbedUrl(lesson.video_url)) {
      setMessage({ ok: false, text: 'ลิงก์วิดีโอไม่ถูกต้อง รองรับลิงก์ YouTube และ Vimeo' });
      return;
    }
    if (lesson.quiz_url && !safeHttpUrl(lesson.quiz_url)) {
      setMessage({ ok: false, text: 'ลิงก์แบบทดสอบต้องขึ้นต้นด้วย https://' });
      return;
    }
    setBusy(true); setMessage(null);
    const db = supabase();
    const quiz = cleanQuestions.map(item => ({ question: item.question, choices: item.choices }));
    const { error } = await db.from('lessons').update({
      title: lesson.title.trim(), video_url: lesson.video_url.trim(), body: lesson.body, image_urls: lesson.image_urls,
      pdf_path: lesson.pdf_path, quiz, quiz_url: lesson.quiz_url.trim(),
    }).eq('id', lesson.id);
    const keyError = error ? null : (await db.from('quiz_keys').upsert({ lesson_id: lesson.id, answers: cleanQuestions.map(item => item.answer) })).error;
    setBusy(false);
    if (error || keyError) { setMessage({ ok: false, text: errorText(error ?? keyError) }); return; }
    if (savedPdf && savedPdf !== lesson.pdf_path) await db.storage.from('lesson-files').remove([savedPdf]);
    setSavedPdf(lesson.pdf_path);
    setQuestions(cleanQuestions);
    update({ quiz });
    setMessage({ ok: true, text: 'บันทึกแล้ว' });
  };

  const embed = lesson.video_url ? videoEmbedUrl(lesson.video_url) : '';

  return <>
    <Link className="ip-back" href={`/admin/course?id=${lesson.course_id}`}>← กลับไปที่คอร์ส</Link>
    <div className="ip-page-head"><div><h1>{lesson.title || 'บทเรียนไม่มีชื่อ'}</h1><p className="ip-muted">ใส่เนื้อหาได้หลายแบบในบทเดียว ช่องที่เว้นว่างจะไม่แสดง</p></div>
      <button type="button" className="ip-btn ghost" onClick={() => setPreview(value => !value)}>{preview ? 'กลับไปแก้ไข' : 'ดูตัวอย่าง'}</button></div>

    {preview ? <div className="ip-card"><h1>{lesson.title}</h1><LessonContent lesson={{ ...lesson, quiz: questions.map(({ question, choices }) => ({ question, choices })) }} /><p className="ip-muted ip-small">* แบบทดสอบในโหมดตัวอย่างจะตรวจคำตอบจากข้อมูลที่บันทึกล่าสุด</p></div> :
    <form className="ip-lesson-form" onSubmit={save}>
      <section className="ip-card ip-form">
        <label>ชื่อบทเรียน<input value={lesson.title} onChange={event => update({ title: event.target.value })} required maxLength={200} /></label>
      </section>

      <section className="ip-card ip-form">
        <h2>🎬 วิดีโอ</h2>
        <label>ลิงก์ YouTube หรือ Vimeo<input value={lesson.video_url} onChange={event => update({ video_url: event.target.value })} placeholder="https://www.youtube.com/watch?v=… หรือ https://vimeo.com/…" /></label>
        <p className="ip-muted ip-small">แนะนำให้ตั้งวิดีโอ YouTube เป็น “ไม่เป็นสาธารณะ (Unlisted)” เพื่อไม่ให้คนค้นเจอ</p>
        {lesson.video_url && (embed ? <div className="ip-video small"><iframe src={embed} title="ตัวอย่างวิดีโอ" allowFullScreen loading="lazy" /></div> : <p className="ip-error">ลิงก์นี้ยังไม่ใช่ลิงก์ YouTube/Vimeo ที่รองรับ</p>)}
      </section>

      <section className="ip-card ip-form">
        <h2>📝 ข้อความและรูปภาพ</h2>
        <label>เนื้อหา (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่)<textarea rows={10} value={lesson.body} onChange={event => update({ body: event.target.value })} /></label>
        <div className="ip-images-admin">{lesson.image_urls.map(src => <figure key={src}><img src={src} alt="" /><button type="button" aria-label="ลบรูป" onClick={() => update({ image_urls: lesson.image_urls.filter(url => url !== src) })}>×</button></figure>)}</div>
        <label className="ip-btn ghost small ip-file-btn">{uploading === 'images' ? 'กำลังอัปโหลด…' : '+ เพิ่มรูปภาพ'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={Boolean(uploading)} onChange={event => { void uploadImages(event.target.files); event.target.value = ''; }} /></label>
      </section>

      <section className="ip-card ip-form">
        <h2>📄 เอกสาร PDF</h2>
        {lesson.pdf_path ? <div className="ip-row"><span className="ip-file-name">{lesson.pdf_path.split('/').pop()}</span><button type="button" className="ip-link-btn danger" onClick={() => update({ pdf_path: '' })}>เอาออกจากบทเรียน</button></div> : <p className="ip-muted">ยังไม่มีไฟล์</p>}
        <label className="ip-btn ghost small ip-file-btn">{uploading === 'pdf' ? 'กำลังอัปโหลด…' : lesson.pdf_path ? 'เปลี่ยนไฟล์ PDF' : 'อัปโหลด PDF (ไม่เกิน 50 MB)'}<input type="file" accept="application/pdf" disabled={Boolean(uploading)} onChange={event => { void uploadPdf(event.target.files?.[0]); event.target.value = ''; }} /></label>
        <p className="ip-muted ip-small">ไฟล์ PDF เก็บแบบส่วนตัว เปิดได้เฉพาะผู้เรียนที่ซื้อคอร์สนี้</p>
      </section>

      <section className="ip-card ip-form">
        <h2>✅ แบบทดสอบ (สร้างบนเว็บ)</h2>
        <p className="ip-muted ip-small">ผู้เรียนจะเห็นคะแนนหลังส่งคำตอบ คำตอบที่ถูกเก็บแยก ผู้เรียนดูล่วงหน้าไม่ได้</p>
        {questions.map((item, qIndex) => <fieldset key={qIndex} className="ip-quiz-admin">
          <legend>ข้อ {qIndex + 1}</legend>
          <label>คำถาม<input value={item.question} onChange={event => updateQuestion(qIndex, { question: event.target.value })} /></label>
          {item.choices.map((choice, cIndex) => <div className="ip-choice-admin" key={cIndex}>
            <input type="radio" name={`answer-${qIndex}`} aria-label={`ตัวเลือก ${cIndex + 1} เป็นคำตอบที่ถูก`} checked={item.answer === cIndex} onChange={() => updateQuestion(qIndex, { answer: cIndex })} />
            <input aria-label={`ตัวเลือก ${cIndex + 1}`} value={choice} placeholder={`ตัวเลือก ${cIndex + 1}`} onChange={event => updateQuestion(qIndex, { choices: item.choices.map((value, i) => (i === cIndex ? event.target.value : value)) })} />
            {item.choices.length > 2 && <button type="button" className="ip-link-btn danger" onClick={() => updateQuestion(qIndex, { choices: item.choices.filter((_, i) => i !== cIndex), answer: item.answer === cIndex ? 0 : item.answer > cIndex ? item.answer - 1 : item.answer })}>ลบ</button>}
          </div>)}
          <div className="ip-row">
            {item.choices.length < 6 && <button type="button" className="ip-link-btn" onClick={() => updateQuestion(qIndex, { choices: [...item.choices, ''] })}>+ เพิ่มตัวเลือก</button>}
            <button type="button" className="ip-link-btn danger" onClick={() => setQuestions(current => current.filter((_, i) => i !== qIndex))}>ลบคำถามนี้</button>
          </div>
          <small className="ip-muted">เลือกวงกลมหน้าตัวเลือกที่เป็นคำตอบที่ถูกต้อง</small>
        </fieldset>)}
        <button type="button" className="ip-btn ghost small" onClick={() => setQuestions(current => [...current, { question: '', choices: ['', '', '', ''], answer: 0 }])}>+ เพิ่มคำถาม</button>
      </section>

      <section className="ip-card ip-form">
        <h2>🔗 ลิงก์แบบทดสอบภายนอก</h2>
        <label>ลิงก์ Google Forms, Quizizz, Kahoot ฯลฯ<input value={lesson.quiz_url} onChange={event => update({ quiz_url: event.target.value })} placeholder="https://forms.gle/…" /></label>
      </section>

      <div className="ip-sticky-save"><SaveBar busy={busy} message={message} /></div>
    </form>}
  </>;
}

export default function AdminLessonPage() {
  return <Suspense fallback={<Loading />}><LessonEditor /></Suspense>;
}
