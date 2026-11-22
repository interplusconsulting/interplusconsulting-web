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
