'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { Course } from '../../lib/types';
import { ItemBadge, PriceTag } from './item-badge';

type ShowcaseExam = {
  id: string; title: string; description: string; level: string; question_count: number; duration_min: number;
  cover_url: string; price: number; course_title: string | null; badge: string; compare_at_price: number;
};

/** Homepage teaser for published online courses and practice exams. Renders nothing until there is something to show. */
export default function OnlineCourses({ showCourses, showExams }: { showCourses: boolean; showExams: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<ShowcaseExam[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (showCourses) void supabase().from('courses').select('id,title,summary,price,compare_at_price,badge,cover_url,position,created_at')
      .eq('is_published', true).order('position').order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setCourses((data as Course[] | null) ?? []));
    // exam_showcase() returns display fields only (no exam links). Missing function = no exams shown.
    if (showExams) void supabase().rpc('exam_showcase').then(({ data, error }) => { if (!error) setExams(((data as ShowcaseExam[] | null) ?? []).slice(0, 4)); });
  }, [showCourses, showExams]);

  const hasCourses = showCourses && courses.length > 0;
  const hasExams = showExams && exams.length > 0;
  if (!hasCourses && !hasExams) return null;

  return <section className="section online-courses" id="courses">
    <div className="heading">
      <div><p className="kicker"><i/> {showCourses && showExams ? 'ONLINE COURSES & EXAMS' : showCourses ? 'ONLINE COURSES' : 'ONLINE EXAMS'}</p><h2>เรียนออนไลน์<br/><em>ได้ทุกที่ ทุกเวลา</em></h2></div>
      <p>{showCourses && showExams
        ? 'คอร์สภาษาอังกฤษและข้อสอบเสมือนจริงจาก Learning Plus by Kru Jew สมัครแล้วเรียนและทำข้อสอบผ่านเว็บได้ทันที'
        : showCourses ? 'คอร์สภาษาอังกฤษออนไลน์จาก Learning Plus by Kru Jew' : 'ข้อสอบเสมือนจริงจาก Learning Plus by Kru Jew'}</p>
    </div>
    <div className="online-layout">
      {hasCourses && <div className="online-group">
        <h3 className="online-group-title">คอร์สเรียน</h3>
        <div className="online-course-grid">
          {courses.map(course => <Link key={course.id} className="online-course-card" href={`/learn/course?id=${course.id}`}>
            <span className="online-course-cover">
              {course.cover_url ? <img src={course.cover_url} alt="" loading="lazy" /> : <span className="online-course-placeholder" aria-hidden="true">{course.title.slice(0, 1)}</span>}
              <ItemBadge badge={course.badge} className="on-cover" />
            </span>
            <span className="online-course-body">
              <strong>{course.title}</strong>
              {course.summary && <span>{course.summary}</span>}
              <span className="online-course-meta"><PriceTag price={course.price} compareAt={course.compare_at_price} /><b>ดูรายละเอียด →</b></span>
            </span>
          </Link>)}
        </div>
        <Link className="online-more" href="/learn/courses">ดูคอร์สทั้งหมด →</Link>
      </div>}
      {hasExams && <div className="online-group">
        <h3 className="online-group-title">ข้อสอบเสมือนจริง</h3>
        <div className="online-exam-panel">
          <ul className="online-exam-list">
            {exams.map(exam => <li key={exam.id}>
              <Link className="online-exam" href={`/learn/exam?id=${exam.id}`}>
                <span className="online-exam-main">
                  <strong>{exam.title}</strong>
                  <span className="online-exam-facts">{[exam.level, exam.question_count > 0 && `${exam.question_count} ข้อ`, exam.duration_min > 0 && `${exam.duration_min} นาที`].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="online-exam-side">
                  <ItemBadge badge={exam.badge} />
                  {Number(exam.price) <= 0 && exam.course_title
                    ? <span className="online-exam-note">รวมในคอร์ส</span>
                    : <PriceTag price={exam.price} compareAt={exam.compare_at_price} freeText="ฟรี" />}
                </span>
              </Link>
            </li>)}
          </ul>
          <Link className="online-exam-all" href="/learn/exams">ดูข้อสอบทั้งหมด →</Link>
        </div>
      </div>}
    </div>
  </section>;
}
