'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatBaht, formatDate, supabase } from '../../../../lib/supabase';
import { orderStatusText, type OrderStatus } from '../../../../lib/types';
import type { DashboardSection } from '../../../_portal/dashboard-sections';
import { loadRevenue, loadWeeklyCounts, recentWeeks } from '../../../_portal/dashboard-periods';
import DashboardExport from '../../../_portal/dashboard-export';
import { loadRecentRecords, RecentRecords, recentRecordHeaders } from './recent-records';
import { BreakdownChart, loadRecentPayments, RecentPayments, TrendChart, type RecentOrder } from './payment-charts';

type Metric = { label: string; filter?: readonly [string, string | boolean] };

const publishedMetrics: readonly Metric[] = [
  { label: 'เผยแพร่แล้ว', filter: ['is_published', true] },
  { label: 'ยังไม่เผยแพร่', filter: ['is_published', false] },
];
const paymentFilters = [
  { status: 'all', label: 'รายการทั้งหมด' },
  { status: 'pending', label: 'สลิปรอตรวจสอบ' },
  { status: 'approved', label: 'อนุมัติแล้ว' },
  { status: 'rejected', label: 'ปฏิเสธแล้ว' },
] as const satisfies readonly { status: OrderStatus | 'all'; label: string }[];

type PaymentFilter = (typeof paymentFilters)[number]['status'];

export default function Dashboard({ section }: { section: DashboardSection }) {
  const [counts, setCounts] = useState<(number | null)[]>();
  const [weeklyCounts, setWeeklyCounts] = useState<(number | null)[]>();
  const [weeks] = useState(recentWeeks);
  const [revenue, setRevenue] = useState<Awaited<ReturnType<typeof loadRevenue>>>();
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [recentResult, setRecentResult] = useState<{ filter: PaymentFilter; orders: RecentOrder[] | null }>();
  const [recentRecords, setRecentRecords] = useState<Awaited<ReturnType<typeof loadRecentRecords>>>();
  const isPayments = section.slug === 'payments';
  const extraMetrics = 'metrics' in section ? section.metrics : publishedMetrics;

  useEffect(() => {
    if (!isPayments) return;
    const controller = new AbortController();
    void loadRevenue(weeks, controller.signal).catch(() => null).then(result => {
      if (!controller.signal.aborted) setRevenue(result);
    });
    return () => controller.abort();
  }, [isPayments, weeks]);

  useEffect(() => {
    if (!isPayments) return;
    const controller = new AbortController();
    void loadRecentPayments(controller.signal, paymentFilter === 'all' ? undefined : paymentFilter, 100).then(orders => {
      if (!controller.signal.aborted) setRecentResult({ filter: paymentFilter, orders });
    });
    return () => controller.abort();
  }, [isPayments, paymentFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const metrics: Metric[] = [{ label: 'ทั้งหมด' }, ...extraMetrics];

    void Promise.all(metrics.map(async ({ filter }) => {
      try {
        const query = supabase().from(section.table).select('id', { count: 'exact', head: true }).abortSignal(controller.signal);
        const { count } = await (filter ? query.eq(...filter) : query);
        return count;
      } catch {
        return null;
      }
    })).then(values => {
      if (!controller.signal.aborted) setCounts(values);
    });

    void loadWeeklyCounts(section.table, weeks, controller.signal).then(values => {
      if (!controller.signal.aborted) setWeeklyCounts(values);
    });

    return () => controller.abort();
  }, [extraMetrics, section.table, weeks]);

  useEffect(() => {
    if (section.slug === 'payments') return;
    const controller = new AbortController();
    void loadRecentRecords(section, controller.signal).then(records => {
      if (!controller.signal.aborted) setRecentRecords(records);
    });
    return () => controller.abort();
  }, [section]);

  const breakdown = extraMetrics.map(({ label }, index) => ({
    label, count: counts?.[index + 1], selected: isPayments && paymentFilters[index + 1]?.status === paymentFilter,
  }));
  if (section.slug === 'contacts') {
    const [total, fresh] = counts ?? [];
    breakdown.push({ label: 'สถานะอื่น', count: typeof total === 'number' && typeof fresh === 'number' ? Math.max(0, total - fresh) : counts ? null : undefined, selected: false });
  }
  const trend = weeks.map(({ label }, index) => ({ label, value: weeklyCounts?.[index] ?? undefined }));
  const recentOrders = recentResult?.filter === paymentFilter ? recentResult.orders : undefined;
  const openPaymentFilter = (status: PaymentFilter) => {
    setPaymentFilter(status);
    document.getElementById('payment-results')?.focus();
  };

  return <div className="admin-overview admin-section-overview">
    <div className="ip-page-head">
      <h1>ภาพรวม{section.label}</h1>
      <div className="ip-row admin-dashboard-actions">
        <DashboardExport name={`ภาพรวม${section.label}`} ready={Boolean(counts && weeklyCounts && (isPayments ? revenue !== undefined && recentOrders !== undefined : recentRecords !== undefined))} sheets={[
          { name: 'สรุป', headers: ['รายการ', 'ยอดรวม', 'หน่วย'], rows: [
            ...(isPayments ? [['รายได้จากรายการที่อนุมัติแล้ว', revenue?.total, 'บาท']] : []),
            ['รายการทั้งหมด', counts?.[0], 'รายการ'],
            ...breakdown.map(({ label, count }) => [label, count, 'รายการ']),
          ] },
          { name: 'แนวโน้ม 28 วัน', headers: ['ช่วงวันที่', 'รายการใหม่', ...(isPayments ? ['รายได้ที่อนุมัติ (บาท)'] : [])],
            rows: trend.map(({ label, value }, index) => [label, value, ...(isPayments ? [revenue?.weekly[index]] : [])]) },
          ...(recentRecords?.length ? [{ name: 'รายการล่าสุด', headers: recentRecordHeaders,
            rows: recentRecords.map(({ name, detail, status, date }) => [name, detail, status, date]) }] : []),
          ...(recentOrders?.length ? [{ name: 'รายการชำระเงินล่าสุด', headers: ['รหัสรายการ', 'วันที่สร้าง', 'สถานะ', 'ยอดเงิน (บาท)'],
            rows: recentOrders.map(order => [order.id, formatDate(order.created_at), orderStatusText[order.status], Number(order.amount)]) }] : []),
        ]} />
        <Link href={section.href} className="ip-btn">
          {isPayments ? 'ไปหน้าตรวจสลิป' : `ไปหน้าจัดการ${section.label}`}
        </Link>
      </div>
    </div>
    <div className="ip-stats" aria-busy={!counts || (isPayments && revenue === undefined)}>
      {isPayments && <div className="ip-stat accent">
        <span>รายได้ทั้งหมด</span>
        <strong>{revenue ? formatBaht(revenue.total) : revenue === null ? '—' : '…'}</strong>
        <small>รวมยอดจากรายการที่อนุมัติแล้ว</small>
      </div>}
      {isPayments ? paymentFilters.map(({ status, label }, index) => <button key={status} type="button"
        className="ip-stat ip-payment-filter-card" aria-pressed={status === paymentFilter}
        aria-controls="payment-results" onClick={() => openPaymentFilter(status)}>
        <span>{label}</span>
        <strong>{counts?.[index] ?? (counts ? '—' : '…')}</strong>
      </button>) : ['ทั้งหมด', ...extraMetrics.map(metric => metric.label)].map((label, index) => <div key={label} className="ip-stat">
        <span>{label}</span>
        <strong>{counts?.[index] ?? (counts ? '—' : '…')}</strong>
      </div>)}
    </div>
    <div className="ip-payment-charts">
      {isPayments ? <TrendChart title="แนวโน้มรายได้" description="ยอดอนุมัติรายสัปดาห์ · 28 วันล่าสุด" formatValue={formatBaht}
        failed={revenue === null} emptyText="ยังไม่มีรายได้จากรายการที่อนุมัติในช่วงนี้"
        points={weeks.map(({ label }, index) => ({ label, value: revenue?.weekly[index] }))} />
        : <TrendChart title="แนวโน้มรายการใหม่" description="จำนวนรายการรายสัปดาห์ · 28 วันล่าสุด" formatValue={value => value.toLocaleString('th-TH')}
          failed={Boolean(weeklyCounts?.includes(null))} emptyText="ยังไม่มีรายการใหม่ในช่วงนี้" points={trend} />}
      <BreakdownChart title={isPayments ? 'สถานะการชำระเงิน' : 'สัดส่วนตามสถานะหรือประเภท'} metrics={breakdown}
        selectMetric={isPayments ? index => openPaymentFilter(paymentFilters[index + 1].status) : undefined} />
    </div>
    {section.slug !== 'payments' && <RecentRecords section={section} records={recentRecords} />}
    {isPayments && <>
      <div id="payment-results" tabIndex={-1} role="region" aria-label="ผลการกรองรายการชำระเงิน">
        <RecentPayments orders={recentOrders} showAll paginate filterLabel={paymentFilter === 'all' ? undefined : paymentFilters.find(item => item.status === paymentFilter)?.label}
          controls={<div className="ip-tabs ip-payment-filter-tabs" role="group" aria-label="กรองตามสถานะ">
            {paymentFilters.map(({ status, label }) => <button key={status} type="button" aria-pressed={status === paymentFilter}
              className={status === paymentFilter ? 'active' : undefined} onClick={() => setPaymentFilter(status)}>{label}</button>)}
          </div>} />
      </div>
      <div className="ip-dashboard-charts"><TrendChart title="แนวโน้มคำสั่งซื้อใหม่" description="จำนวนคำสั่งซื้อรายสัปดาห์ · 28 วันล่าสุด"
        formatValue={value => value.toLocaleString('th-TH')} failed={Boolean(weeklyCounts?.includes(null))}
        emptyText="ยังไม่มีคำสั่งซื้อใหม่ในช่วงนี้" points={trend} /></div>
    </>}
    {(counts?.includes(null) || weeklyCounts?.includes(null) || revenue === null) && <p role="status">โหลดข้อมูลบางรายการไม่สำเร็จ</p>}
  </div>;
}
