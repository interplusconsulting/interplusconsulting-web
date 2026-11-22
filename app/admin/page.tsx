'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatBaht, supabase } from '../../lib/supabase';
import { loadRevenue, loadWeeklyCounts, recentWeeks } from '../_portal/dashboard-periods';
import { AdminSelect } from '../_portal/admin-ui';
import DashboardExport from '../_portal/dashboard-export';
import { BreakdownChart, loadRecentPayments, RecentPayments, TrendChart, type RecentOrder } from './overview/[section]/payment-charts';

type Count = number | null;
type Stats = { contacts: Count; pending: Count; approved: Count; rejected: Count; students: Count; courses: Count; posts: Count; announcements: Count; exams: Count; reviews: Count };

const numberFormat = new Intl.NumberFormat('th-TH');
const formatCount = (count?: Count) => count === undefined ? '…' : count === null ? '—' : numberFormat.format(count);
const series = [
  { table: 'orders', label: 'คำสั่งซื้อใหม่' },
  { table: 'profiles', label: 'ผู้เรียนใหม่', role: 'student' },
  { table: 'contact_requests', label: 'ผู้ติดต่อใหม่' },
] as const;

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[] | null>();
  const [revenueTotal, setRevenueTotal] = useState<Count>();
  const [selected, setSelected] = useState<(typeof series)[number]['table']>('orders');
  const [weeks] = useState(recentWeeks);
  const [activity, setActivity] = useState<{ table: string; counts: Count[] }>();
  const selectedSeries = series.find(item => item.table === selected) ?? series[0];
  const weekly = activity?.table === selected ? activity.counts : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const { table } = selectedSeries;
    const role = 'role' in selectedSeries ? selectedSeries.role : undefined;
    void loadWeeklyCounts(table, weeks, controller.signal, role).then(counts => {
      if (!controller.signal.aborted) setActivity({ table, counts });
    });
    return () => controller.abort();
  }, [selectedSeries, weeks]);

  useEffect(() => {
    const db = supabase();
    const controller = new AbortController();
    const count = async (query: PromiseLike<{ count: Count }>) => {
      try { return (await query).count; }
      catch { return null; }
    };
    Promise.all([
      count(db.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')),
      count(db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      count(db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'approved')),
      count(db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'rejected')),
      count(db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')),
      count(db.from('courses').select('id', { count: 'exact', head: true })),
      count(db.from('posts').select('id', { count: 'exact', head: true })),
      count(db.from('announcements').select('id', { count: 'exact', head: true })),
      count(db.from('exams').select('id', { count: 'exact', head: true })),
      count(db.from('reviews').select('id', { count: 'exact', head: true })),
    ]).then(([contacts, pending, approved, rejected, students, courses, posts, announcements, exams, reviews]) => {
      if (!controller.signal.aborted) setStats({ contacts, pending, approved, rejected, students, courses, posts, announcements, exams, reviews });
    });
    void loadRecentPayments(controller.signal).then(result => {
      if (!controller.signal.aborted) setRecentOrders(result);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadRevenue(weeks, controller.signal).catch(() => null).then(result => {
      if (!controller.signal.aborted) setRevenueTotal(result?.total ?? null);
    });
    return () => controller.abort();
  }, [weeks]);

  const tasks = [
    { href: '/admin/overview/payments', label: 'สลิปรอตรวจสอบ', value: stats?.pending },
    { href: '/admin/overview/contacts', label: 'ผู้ติดต่อใหม่', value: stats?.contacts },
  ];
  const metrics = [
    { href: '/admin/overview/payments', label: 'คำสั่งซื้อทั้งหมด',
      value: !stats ? undefined : stats.pending === null || stats.approved === null || stats.rejected === null
        ? null : stats.pending + stats.approved + stats.rejected },
    { href: '/admin/overview/users', label: 'ผู้เรียนทั้งหมด', value: stats?.students },
    { href: '/admin/overview/courses', label: 'คอร์สเรียน', value: stats?.courses },
    { href: '/admin/overview/exams', label: 'คลังข้อสอบ', value: stats?.exams },
  ];
  const content = [
    { href: '/admin/overview/announcements', label: 'ประกาศ', value: stats?.announcements },
    { href: '/admin/overview/posts', label: 'โพสต์', value: stats?.posts },
    { href: '/admin/overview/reviews', label: 'รีวิว', value: stats?.reviews },
  ];

  return <div className="admin-overview">
    <div className="admin-overview-heading">
      <div>
        <h1>ภาพรวมหลังบ้าน</h1>
        <p>Inter Plus Consulting</p>
      </div>
      <div className="ip-row admin-dashboard-actions">
        <DashboardExport name="ภาพรวมหลังบ้าน" ready={Boolean(stats && weekly && revenueTotal !== undefined)} sheets={[
          { name: 'สรุป', headers: ['รายการ', 'ยอดรวม', 'หน่วย'], rows: [
            ['รายได้จากรายการที่อนุมัติแล้ว', revenueTotal, 'บาท'],
            ...[...metrics, ...tasks, ...content].map(({ label, value }) => [label, value, 'รายการ']),
            ['อนุมัติแล้ว', stats?.approved, 'รายการ'],
            ['ปฏิเสธแล้ว', stats?.rejected, 'รายการ'],
          ] },
          { name: 'แนวโน้ม 28 วัน', headers: ['ช่วงวันที่', selectedSeries.label],
            rows: weeks.map(({ label }, index) => [label, weekly?.[index]]) },
        ]} />
        <Link className="ip-btn" href="/admin/orders">ไปหน้าตรวจสลิป <DirectionArrow /></Link>
      </div>
    </div>

    <div className="admin-overview-grid admin-overview-charts">
      <div className="admin-activity">
        <TrendChart title="กิจกรรมในระบบ" description="จำนวนรายการรายสัปดาห์ · 28 วันล่าสุด" formatValue={formatCount}
          failed={Boolean(weekly?.includes(null))} emptyText="ยังไม่มีรายการในช่วงนี้"
          points={weeks.map(({ label }, index) => ({ label, value: weekly?.[index] ?? undefined }))}
          controls={<div className="admin-series-picker">
            <AdminSelect label="เลือกข้อมูลกราฟ" hideLabel value={selected}
              options={series.map(item => ({ value: item.table, label: item.label }))}
              onChange={value => {
                const item = series.find(option => option.table === value);
                if (item) setSelected(item.table);
              }} />
          </div>} />
      </div>
      <BreakdownChart title="สถานะการชำระเงิน" metrics={[
        { label: 'รอตรวจสอบ', count: stats?.pending },
        { label: 'อนุมัติแล้ว', count: stats?.approved },
        { label: 'ปฏิเสธแล้ว', count: stats?.rejected },
      ]} />
    </div>

    <ul className="admin-kpis" aria-label="ยอดรวมระบบสมาชิก" aria-busy={!stats || revenueTotal === undefined}>
      <li className="admin-revenue-kpi">
        <Link href="/admin/overview/payments">
          <span>รายได้ทั้งหมด</span>
          <strong>{typeof revenueTotal === 'number' ? formatBaht(revenueTotal) : formatCount(revenueTotal)}</strong>
          <DirectionArrow />
          <small>จากรายการที่อนุมัติแล้ว</small>
        </Link>
      </li>
      {metrics.map(({ href, label, value }) => <li key={href}>
        <Link href={href}><span>{label}</span><strong>{formatCount(value)}</strong><DirectionArrow /></Link>
      </li>)}
    </ul>

    <div className="admin-overview-grid admin-overview-details">
      <div className="admin-overview-side" aria-busy={!stats}>
      <section className="admin-panel admin-queue">
        <header><h2>รอดำเนินการ</h2></header>
        <ul>
          {tasks.map(({ href, label, value }) => <li key={href}>
            <Link href={href}>
              <strong className={value ? 'has-work' : undefined}>{formatCount(value)}</strong>
              <span>{label}</span>
              <DirectionArrow />
            </Link>
          </li>)}
        </ul>
      </section>
      <section className="admin-panel admin-content">
        <header><h2>เนื้อหาบนเว็บไซต์</h2></header>
        <ul>
          {content.map(({ href, label, value }) => <li key={href}>
            <Link href={href}>
              <span>{label}</span>
              <strong>{formatCount(value)}</strong>
              <DirectionArrow />
            </Link>
          </li>)}
        </ul>
      </section>
      </div>
      <RecentPayments orders={recentOrders} showAll />
    </div>
    {stats && Object.values(stats).includes(null) && <p className="admin-overview-error" role="status">โหลดข้อมูลบางหมวดไม่สำเร็จ กรุณารีเฟรชหน้าเพื่อลองอีกครั้ง</p>}
  </div>;
}

function DirectionArrow() {
  return <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M4 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
