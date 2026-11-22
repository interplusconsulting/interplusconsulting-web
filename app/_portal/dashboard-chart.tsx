type ChartPoint = { label: string; value?: number | null };

export default function DashboardChart({ title, points, formatValue = (value) => value.toLocaleString('th-TH') }: {
  title: string;
  points: ChartPoint[];
  formatValue?: (value: number) => string;
}) {
  const maximum = Math.max(1, ...points.map(point => point.value ?? 0));

  return <section className="ip-card ip-dashboard-chart">
    <h2>{title}</h2>
    <ul>
      {points.map(({ label, value }) => <li key={label}>
        <span>{label}</span>
        <div className="ip-chart-track" aria-hidden="true">
          <div className="ip-chart-bar" style={{ width: `${(value ?? 0) / maximum * 100}%` }} />
        </div>
        <strong>{value === null ? '—' : value === undefined ? '…' : formatValue(value)}</strong>
      </li>)}
    </ul>
  </section>;
}
