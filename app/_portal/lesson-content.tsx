'use client';

import { useEffect, useState } from 'react';
import { safeHttpUrl, videoEmbedUrl } from '../../lib/media';
import { errorText, supabase } from '../../lib/supabase';
import type { Lesson } from '../../lib/types';

export function TextBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map(part => part.trim()).filter(Boolean);
  return <div className="ip-prose">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

export function VideoBlock({ url }: { url: string }) {
  const embed = videoEmbedUrl(url);
  if (!embed) return <p className="ip-notice">ไม่สามารถแสดงวิดีโอจากลิงก์นี้ได้ <a href={safeHttpUrl(url) || undefined} target="_blank" rel="noreferrer">เปิดลิงก์วิดีโอ ↗</a></p>;
  return <div className="ip-video"><iframe src={embed} title="วิดีโอบทเรียน" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>;
}

function PdfBlock({ path }: { path: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    supabase().storage.from('lesson-files').createSignedUrl(path, 60 * 60).then(({ data, error: signError }) => {
      if (!active) return;
      if (signError) setError(errorText(signError)); else setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [path]);
  if (error) return <p className="ip-error">เปิดไฟล์เอกสารไม่ได้: {error}</p>;
  if (!url) return <p className="ip-muted">กำลังเตรียมไฟล์เอกสาร…</p>;
  return <div className="ip-pdf">
    <div className="ip-row"><strong>เอกสารประกอบบทเรียน (PDF)</strong><a className="ip-btn small" href={url} target="_blank" rel="noreferrer">เปิด / ดาวน์โหลด ↗</a></div>
    <iframe src={url} title="เอกสารประกอบบทเรียน" loading="lazy" />
    <p className="ip-muted ip-small">ถ้าเอกสารไม่แสดง (เช่น บนมือถือบางรุ่น) กรุณากดปุ่ม “เปิด / ดาวน์โหลด”</p>
  </div>;
}

function QuizBlock({ lesson }: { lesson: Lesson }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [result, setResult] = useState<{ score: number; total: number; correct: number[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (answers.some(answer => answer === null)) { setError('กรุณาตอบให้ครบทุกข้อ'); return; }
    setBusy(true); setError('');
    const { data, error: rpcError } = await supabase().rpc('submit_quiz', { p_lesson: lesson.id, p_answers: answers });
    setBusy(false);
    if (rpcError) { setError(errorText(rpcError)); return; }
    const row = (data as { score: number; total: number; correct: number[] }[])[0];
    setResult(row);
  };

  return <div className="ip-quiz">
    <h3>แบบทดสอบ</h3>
    {lesson.quiz.map((item, qIndex) => <fieldset key={qIndex} className="ip-question">
      <legend>{qIndex + 1}. {item.question}</legend>
      {item.choices.map((choice, cIndex) => {
        const chosen = answers[qIndex] === cIndex;
        const state = result ? (result.correct[qIndex] === cIndex ? 'correct' : chosen ? 'wrong' : '') : '';
        return <label key={cIndex} className={`ip-choice ${state}`}>
          <input type="radio" name={`q-${lesson.id}-${qIndex}`} checked={chosen} disabled={Boolean(result)} onChange={() => setAnswers(current => current.map((value, i) => (i === qIndex ? cIndex : value)))} />
          <span>{choice}</span>
        </label>;
      })}
    </fieldset>)}
    {error && <p className="ip-error" role="alert">{error}</p>}
    {result ? <div className="ip-score">
      <strong>ได้ {result.score} / {result.total} คะแนน</strong>
      <button type="button" className="ip-btn ghost small" onClick={() => { setResult(null); setAnswers(lesson.quiz.map(() => null)); }}>ทำใหม่อีกครั้ง</button>
    </div> : <button type="button" className="ip-btn" disabled={busy} onClick={() => void submit()}>{busy ? 'กำลังตรวจ…' : 'ส่งคำตอบ'}</button>}
  </div>;
}

export default function LessonContent({ lesson }: { lesson: Lesson }) {
  const quizUrl = safeHttpUrl(lesson.quiz_url);
  const hasAnything = lesson.video_url || lesson.body || lesson.image_urls.length || lesson.pdf_path || lesson.quiz.length || quizUrl;
  return <div className="ip-lesson-content">
    {lesson.video_url && <VideoBlock url={lesson.video_url} />}
    {lesson.body && <TextBlock text={lesson.body} />}
    {lesson.image_urls.length > 0 && <div className="ip-lesson-images">{lesson.image_urls.map(src => <img key={src} src={src} alt="" loading="lazy" />)}</div>}
    {lesson.pdf_path && <PdfBlock path={lesson.pdf_path} />}
    {lesson.quiz.length > 0 && <QuizBlock key={lesson.id} lesson={lesson} />}
    {quizUrl && <div className="ip-card ip-quiz-link"><div><strong>แบบทดสอบออนไลน์</strong><p className="ip-muted">แบบทดสอบนี้อยู่บนเว็บไซต์ภายนอก จะเปิดในแท็บใหม่</p></div><a className="ip-btn" href={quizUrl} target="_blank" rel="noreferrer">ทำแบบทดสอบ ↗</a></div>}
    {!hasAnything && <p className="ip-muted">บทเรียนนี้ยังไม่มีเนื้อหา</p>}
  </div>;
}
