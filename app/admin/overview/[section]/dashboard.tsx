'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatBaht, supabase } from '../../../../lib/supabase';
import type { OrderStatus } from '../../../../lib/types';
import type { DashboardSection } from '../../../_portal/dashboard-sections';
import { loadWeeklyCounts, recentWeeks } from '../../../_portal/dashboard-periods';
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

async function loadRevenue(weeks: ReturnType<typeof recentWeeks>, signal: AbortSignal) {
  let totalSatang = 0;
  const weeklySatang = weeks.map(() => 0);
  let afterId: string | undefined;

  const db = supabase();
  while (!signal.aborted) {
    const query = db.from('orders').select('id, amount, reviewed_at, created_at')
      .eq('status', 'approved').order('id').limit(500).abortSignal(signal);
    const { data, error } = await (afterId ? query.gt('id', afterId) : query);
    if (error || !data) return null;
    if (!data.length) break;

    for (const order of data) {
      const satang = Math.round(Number(order.amount) * 100);
      totalSatang += satang;
      const date = new Date(order.reviewed_at ?? order.created_at).getTime();
      const index = weeks.findIndex(({ start, end }) => date >= Date.parse(start) && date < Date.parse(end));
      if (index >= 0) weeklySatang[index] += satang;
    }
    afterId = data[data.length - 1].id;
  }

  return { total: totalSatang / 100, weekly: weeklySatang.map(value => value / 100) };
}

export default function Dashboard({ section }: { section: DashboardSection }) {
  const [counts, setCounts] = useState<(number | null)[]>();
  const [weeklyCounts, setWeeklyCounts] = useState<(number | null)[]>();
  const [weeks] = useState(recentWeeks);
  const [revenue, setRevenue] = useState<Awaited<ReturnType<typeof loadRevenue>>>();
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [recentResult, setRecentResult] = useState<{ filter: PaymentFilter; orders: RecentOrder[] | null }>();
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
    void loadRecentPayments(controller.signal, paymentFilter === 'all' ? undefined : paymentFilter).then(orders => {
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
      <Link href={section.href} className="ip-btn">
        {section.slug === 'payments' ? 'ไปหน้าตรวจสลิป' : `ไปหน้าจัดการ${section.label}`}
      </Link>
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
    {isPayments && <>
      <div id="payment-results" tabIndex={-1} role="region" aria-label="ผลการกรองรายการชำระเงิน">
        <RecentPayments orders={recentOrders} filterLabel={paymentFilter === 'all' ? undefined : paymentFilters.find(item => item.status === paymentFilter)?.label}
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
