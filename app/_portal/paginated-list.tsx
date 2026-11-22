'use client';

import { useState, type ReactNode } from 'react';

const pageSizes = [10, 20, 50, 100];
const number = new Intl.NumberFormat('th-TH');

export default function PaginatedList<T>({ items, children, resetKey = '' }: {
  items: readonly T[];
  children: (pageItems: readonly T[]) => ReactNode;
  resetKey?: string;
}) {
  const [size, setSize] = useState(10);
  const [position, setPosition] = useState({ index: 0, resetKey });
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const page = position.resetKey === resetKey ? Math.min(position.index, pageCount - 1) : 0;
  const start = page * size;
  const end = Math.min(start + size, items.length);
  const move = (index: number) => setPosition({ index, resetKey });
  if (!items.length) return null;

  return <>
    <div className="ip-pagination-options">
      <label>รายการต่อหน้า
        <select value={size} onChange={event => { setSize(Number(event.target.value)); move(0); }}>
          {pageSizes.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <span role="status">{items.length ? `${number.format(start + 1)}–${number.format(end)} จาก ${number.format(items.length)} รายการ` : '0 รายการ'}</span>
    </div>
    {children(items.slice(start, end))}
    {pageCount > 1 && <nav className="ip-pagination-pages" aria-label="เปลี่ยนหน้ารายการ">
      <button type="button" className="ip-btn ghost small" disabled={page === 0} onClick={() => move(page - 1)}>ก่อนหน้า</button>
      <span>หน้า {number.format(page + 1)} / {number.format(pageCount)}</span>
      <button type="button" className="ip-btn ghost small" disabled={page + 1 >= pageCount} onClick={() => move(page + 1)}>ถัดไป</button>
    </nav>}
  </>;
}
