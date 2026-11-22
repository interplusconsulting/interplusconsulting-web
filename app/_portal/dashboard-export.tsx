'use client';

import { useState } from 'react';

type ExportSheet = { name: string; headers: string[]; rows: (string | number | null | undefined)[][] };

export default function DashboardExport({ name, sheets, ready }: { name: string; sheets: ExportSheet[]; ready: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      const { default: writeExcel } = await import('write-excel-file/browser');
      await writeExcel(sheets.map(({ name, headers, rows }) => ({
        sheet: name,
        columns: headers.map((_, index) => ({ width: index === 0 ? 34 : 23 })),
        stickyRowsCount: 1,
        data: [headers.map(value => ({ value, fontWeight: 'bold' as const })), ...rows.map(row => row.map(value => value ?? null))],
      }))).toFile(`${name}.xlsx`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-dashboard-export">
    <button type="button" className="ip-btn ghost" disabled={!ready || busy} onClick={() => void download()}>
      {busy ? 'กำลังส่งออก…' : 'ส่งออก Excel'}
    </button>
    {error && <small className="ip-error" role="alert">ส่งออก Excel ไม่สำเร็จ กรุณาลองอีกครั้ง</small>}
  </div>;
}
