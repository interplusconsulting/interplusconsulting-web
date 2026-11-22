export const reviewAgeUnits = [
  { value: 'day', label: 'วัน' },
  { value: 'week', label: 'สัปดาห์' },
  { value: 'month', label: 'เดือน' },
  { value: 'year', label: 'ปี' },
] as const;

export type ReviewAgeUnit = (typeof reviewAgeUnits)[number]['value'];
const dayMs = 86_400_000;
const bangkokOffset = 25_200_000;

export function bangkokReviewDay(now = Date.now()): number {
  return Math.floor((now + bangkokOffset) / dayMs) * dayMs;
}

export function msUntilNextReviewDay(now = Date.now()): number {
  return bangkokReviewDay(now) + dayMs - bangkokOffset - now;
}

function addMonths(day: number, months: number): number {
  const date = new Date(day);
  const dayOfMonth = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(date.getTime());
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(dayOfMonth, lastDay.getUTCDate()));
  return date.getTime();
}

export function saveReviewAge(amount: number, unit: ReviewAgeUnit, today = bangkokReviewDay()): string {
  const day = unit === 'day' || unit === 'week'
    ? today - amount * (unit === 'week' ? 7 : 1) * dayMs
    : addMonths(today, -amount * (unit === 'year' ? 12 : 1));
  return `${new Date(day).toISOString().slice(0, 10)}|${unit}`;
}

export function readReviewAge(value: string, today = bangkokReviewDay()): { amount: number; unit: ReviewAgeUnit } | null {
  const match = /^(\d{4}-\d{2}-\d{2})\|(day|week|month|year)$/.exec(value);
  if (!match) return null;
  const original = Date.parse(`${match[1]}T00:00:00Z`);
  if (!Number.isFinite(original)) return null;
  const unit = match[2] as ReviewAgeUnit;
  if (unit === 'day' || unit === 'week') {
    return { amount: Math.max(0, Math.floor((today - original) / dayMs / (unit === 'week' ? 7 : 1))), unit };
  }
  const start = new Date(original);
  const end = new Date(today);
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  const completed = addMonths(original, months) > today ? months - 1 : months;
  return { amount: Math.max(0, Math.floor(completed / (unit === 'year' ? 12 : 1))), unit };
}

export function formatReviewAge(value: string, today = bangkokReviewDay()): string {
  const age = readReviewAge(value, today);
  if (!age) return value;
  if (age.amount === 0 && age.unit === 'day') return 'วันนี้';
  return `${age.amount} ${reviewAgeUnits.find(item => item.value === age.unit)?.label}ที่แล้ว`;
}
