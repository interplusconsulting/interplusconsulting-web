import Link from 'next/link';
import { formatBaht, formatDate, supabase } from '../../../../lib/supabase';
import { orderStatusText, type OrderStatus } from '../../../../lib/types';
import type { ReactNode } from 'react';
import PaginatedList from '../../../_portal/paginated-list';

export type RecentOrder = { id: string; amount: number; created_at: string; status: OrderStatus };
export async function loadRecentPayments(signal: AbortSignal, status?: OrderStatus, limit = 5): Promise<RecentOrder[] | null> {
  try {
    const query = supabase().from('orders').select('id, amount, created_at, status')
      .order('created_at', { ascending: false }).order('id').limit(limit).abortSignal(signal);
    const { data, error } = await (status ? query.eq('status', status) : query);
    return error ? null : data;
  } catch {
    return null;
  }
}
type RevenuePoint = { label: string; value?: number };

const statuses = [
  { status: 'pending', color: '#c78a19' },
  { status: 'approved', color: '#157e72' },
  { status: 'rejected', color: '#8055af' },
] as const;

export function TrendChart({ points, failed, title, description, formatValue, emptyText, controls }: {
  points: RevenuePoint[];
  failed: boolean;
  title: string;
  description: string;
  formatValue: (value: number) => string;
  emptyText: string;
  controls?: ReactNode;
}) {
  const values = points.map(point => point.value ?? 0);
  const highest = Math.max(...values);
  const scale = highest > 0 ? highest : 1;
  const step = 600 / points.length;
  const coordinates = values.map((value, index) => [(index + .5) * step, 144 - value / scale * 126]);
  const line = coordinates.map(point => point.join(',')).join(' ');
  return <section className="ip-card ip-revenue-panel">
      <header className="ip-trend-header">
        <div><h2>{title}</h2><p>{description}</p></div>
        {controls}
      </header>
      {failed || points.some(point => point.value === undefined) ? <p role="status">{failed ? 'โหลดข้อมูลกราฟไม่สำเร็จ' : 'กำลังโหลดข้อมูล…'}</p> : <>
        <svg className="ip-revenue-plot" viewBox="0 0 600 156" role="img" aria-label={title}>
          {[18, 60, 102, 144].map(y => <line key={y} x1="12" x2="588" y1={y} y2={y} stroke="#dce7ee" />)}
          <polygon points={`${step / 2},144 ${line} ${600 - step / 2},144`} fill="#e3edf9" />
          <polyline points={line} fill="none" stroke="#245c9c" strokeWidth="3" strokeLinejoin="round" />
          {coordinates.map(([x, y], index) => <circle key={x} cx={x} cy={y} r="5" fill="#245c9c">
            <title>{points[index].label} · {formatValue(values[index])}</title>
          </circle>)}
        </svg>
        <ul className="ip-revenue-labels">
          {points.map(({ label, value }) => <li key={label}><span>{label}</span><strong>{formatValue(value ?? 0)}</strong></li>)}
        </ul>
        {highest === 0 && <p className="ip-payment-empty">{emptyText}</p>}
      </>}
    </section>;
}

export function BreakdownChart({ title, metrics, selectMetric }: {
  title: string;
  metrics: { label: string; count?: number | null; selected?: boolean }[];
  selectMetric?: (index: number) => void;
}) {
  const breakdown = metrics.map((metric, index) => ({ ...metric, color: statuses[index % statuses.length].color }));
  const total = breakdown.reduce((sum, item) => sum + (item.count ?? 0), 0);
  const complete = breakdown.every(item => typeof item.count === 'number');
  let offset = 0;
  const stops = breakdown.map(({ color, count }) => {
    const start = offset;
    offset += (count ?? 0) / (total || 1) * 100;
    return `${color} ${start}% ${offset}%`;
  });

  return <section className="ip-card ip-payment-status-panel">
      <h2>{title}</h2>
      <div className="ip-payment-donut" style={{ background: complete && total ? `conic-gradient(${stops.join(', ')})` : '#e7edf2' }}>
        <div><strong>{complete ? total.toLocaleString('th-TH') : breakdown.some(item => item.count === null) ? '—' : '…'}</strong><span>รายการทั้งหมด</span></div>
      </div>
      <ul className="ip-payment-legend">
        {breakdown.map(({ label, color, count, selected }, index) => <li key={label}>
          <i style={{ background: color }} aria-hidden="true" />
          {selectMetric ? <button className="ip-status-legend-button" type="button" aria-pressed={selected}
            onClick={() => selectMetric(index)}>{label}</button> : <span>{label}</span>}
          <strong>{count === null ? '—' : count?.toLocaleString('th-TH') ?? '…'}</strong>
          <span>{complete ? `${(total ? (count ?? 0) / total * 100 : 0).toLocaleString('th-TH', { maximumFractionDigits: 1 })}%` : '—'}</span>
        </li>)}
      </ul>
    </section>;
}

export function RecentPayments({ orders, showAll = false, controls, filterLabel, paginate = false }: {
  orders?: RecentOrder[] | null;
  showAll?: boolean;
  controls?: ReactNode;
  filterLabel?: string;
  paginate?: boolean;
}) {
  const renderTable = (items: readonly RecentOrder[]) => <div className="ip-table-wrap">
      <table className="ip-table">
        <thead><tr><th scope="col">รหัสรายการ</th><th scope="col">วันที่สร้าง</th><th scope="col">สถานะ</th><th scope="col">ยอดเงิน</th></tr></thead>
        <tbody>{items.map(order => <tr key={order.id}>
          <td data-label="รหัสรายการ"><span title={order.id}>{order.id.slice(0, 8)}</span></td>
          <td data-label="วันที่สร้าง">{formatDate(order.created_at)}</td>
          <td data-label="สถานะ"><span className={`ip-status ${order.status}`}>{orderStatusText[order.status]}</span></td>
          <td data-label="ยอดเงิน">{formatBaht(order.amount)}</td>
        </tr>)}</tbody>
      </table>
    </div>;
  return <section className="ip-card ip-recent-payments">
    <header className="ip-recent-payments-head">
      <h2>รายการชำระเงินล่าสุด</h2>
      {showAll && <Link href="/admin/orders">ดูทั้งหมด</Link>}
    </header>
    {controls}
    {paginate ? <PaginatedList items={orders ?? []} resetKey={filterLabel}>{renderTable}</PaginatedList> : !!orders?.length && renderTable(orders)}
    {!orders?.length && <p role="status">{orders === null ? 'โหลดรายการล่าสุดไม่สำเร็จ' : orders ? filterLabel ? `ไม่มีรายการสถานะ ${filterLabel}` : 'ยังไม่มีรายการชำระเงิน' : 'กำลังโหลดรายการ…'}</p>}
  </section>;
}
