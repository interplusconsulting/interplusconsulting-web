/** Badges and promotion-price helpers shared by the homepage, the student area and admin. */

export type BadgeKey = '' | 'bestseller' | 'recommended' | 'new' | 'promotion';

export const badgeOptions: readonly { value: BadgeKey; label: string }[] = [
  { value: '', label: 'ไม่มีป้าย' },
  { value: 'bestseller', label: 'ขายดีที่สุด' },
  { value: 'recommended', label: 'แนะนำ' },
  { value: 'new', label: 'มาใหม่' },
  { value: 'promotion', label: 'โปรโมชั่น' },
];

export function badgeLabel(key: string | null | undefined): string {
  return badgeOptions.find(option => option.value === key && key)?.label ?? '';
}

/** True when the item is on promotion: an original price higher than the price actually charged. */
export function isOnPromo(price: number, compareAt: number | null | undefined): boolean {
  return Number(compareAt) > 0 && Number(compareAt) > Number(price);
}

/** Whole-number discount, e.g. 1490 → 990 gives 34. */
export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!isOnPromo(price, compareAt)) return 0;
  return Math.round((1 - Number(price) / Number(compareAt)) * 100);
}

/** Sale price from a regular price and a percent off, rounded to whole baht. */
export function priceAfterPercent(regular: number, percent: number): number {
  const p = Math.min(100, Math.max(0, percent));
  return Math.max(0, Math.round((Number(regular) * (100 - p)) / 100));
}
