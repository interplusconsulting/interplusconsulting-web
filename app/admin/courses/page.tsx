'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { errorText, formatBaht, supabase } from '../../../lib/supabase';
import type { Course } from '../../../lib/types';
import { badgeLabel, isOnPromo } from '../../../lib/pricing';
import { AdminListHeading, IconLink, PublishSwitch, StatusPill } from '../../_portal/admin-ui';
import { Loading } from '../../_portal/shell';

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase().from('courses').select('*').order('position').order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => { if (loadError) setError(errorText(loadError)); setCourses((data as Course[]) ?? []); });
  }, []);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get('title')).trim();
    if (!title) return;
    setBusy(true);
    const { data, error: insertError } = await supabase().from('courses').insert({ title, position: courses?.length ?? 0 }).select('id').single();
    setBusy(false);
    if (insertError) { setError(errorText(insertError)); return; }
    router.push(`/admin/course?id=${data.id}`);
  };

  const togglePublished = async (course: Course) => {
    const { data, error } = await supabase().from('courses')
      .update({ is_published: !course.is_published, updated_at: new Date().toISOString() })
      .eq('id', course.id).select('is_published').single();
    if (error) throw error;
    setCourses(current => current?.map(item => item.id === course.id ? { ...item, is_published: data.is_published } : item) ?? null);
  };

  return <>
    <div className="ip-page-head"><div><h1>จัดการคอร์สเรียน</h1><p className="ip-muted">สร้างคอร์ส ตั้งราคา และเพิ่มบทเรียน คอร์สที่ “เผยแพร่” จะแสดงในหน้าคอร์สทั้งหมดของผู้เรียน</p></div></div>
    <form className="ip-card ip-inline-form" onSubmit={create}>
      <label>ชื่อคอร์สใหม่<input name="title" required maxLength={200} placeholder="เช่น IELTS Speaking 30 ชั่วโมง" /></label>
      <button className="ip-btn" type="submit" disabled={busy}>+ สร้างคอร์ส</button>
    </form>
    {error && <p className="ip-error">{error}</p>}
    {!courses && <Loading />}
    {courses && courses.length === 0 && <div className="ip-empty"><h2>ยังไม่มีคอร์ส</h2><p>เริ่มสร้างคอร์สแรกด้านบน</p></div>}
    {!!courses?.length && <AdminListHeading title="รายการคอร์ส" count={courses.length} />}
    {courses && courses.length > 0 && <div className="ip-table-wrap"><table className="ip-table">
      <thead><tr><th>คอร์ส</th><th>ราคา</th><th>สถานะ</th><th /></tr></thead>
      <tbody>{courses.map(course => <tr key={course.id}>
        <td data-label="คอร์ส"><b>{course.title}</b><br /><small className="ip-muted">{course.summary}</small></td>
        <td data-label="ราคา">{Number(course.price) > 0 ? formatBaht(course.price) : 'ฟรี'}
          {isOnPromo(course.price, course.compare_at_price) && <><br /><small className="ip-muted">จาก <s>{formatBaht(course.compare_at_price)}</s></small></>}
          {badgeLabel(course.badge) && <><br /><small className="ip-muted">ป้าย: {badgeLabel(course.badge)}</small></>}</td>
        <td data-label="สถานะ"><div className="ip-row">
          <StatusPill on={course.is_published} />
          <PublishSwitch checked={course.is_published} label={`เผยแพร่คอร์ส ${course.title}`} onToggle={() => togglePublished(course)} />
        </div></td>
        <td><div className="admin-row-actions"><IconLink icon="edit" label="แก้ไขคอร์สและบทเรียน" href={`/admin/course?id=${course.id}`} /></div></td>
      </tr>)}</tbody>
    </table></div>}
  </>;
}
