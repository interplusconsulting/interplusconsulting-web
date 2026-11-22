import { supabase } from '../../lib/supabase';

const day = 24 * 60 * 60 * 1000;
const bangkokOffset = 7 * 60 * 60 * 1000;
const dateLabel = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short' });

export function recentWeeks() {
  const tomorrow = Math.floor((Date.now() + bangkokOffset) / day) * day - bangkokOffset + day;
  return [4, 3, 2, 1].map(week => {
    const start = tomorrow - week * 7 * day;
    const end = start + 7 * day;
    return {
      label: `${dateLabel.format(start)} – ${dateLabel.format(end - day)}`,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    };
  });
}

export function loadWeeklyCounts(table: string, weeks: ReturnType<typeof recentWeeks>, signal: AbortSignal, role?: string) {
  const db = supabase();
  return Promise.all(weeks.map(async ({ start, end }) => {
    try {
      const query = db.from(table).select('id', { count: 'exact', head: true })
        .gte('created_at', start).lt('created_at', end).abortSignal(signal);
      const { count } = await (role ? query.eq('role', role) : query);
      return count;
    } catch {
      return null;
    }
  }));
}

export async function loadRevenue(weeks: ReturnType<typeof recentWeeks>, signal: AbortSignal) {
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
