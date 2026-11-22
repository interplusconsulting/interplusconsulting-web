import { badgeLabel, discountPercent, isOnPromo } from '../../lib/pricing';
import { formatBaht } from '../../lib/supabase';

const badgeIcons: Record<string, string> = {
  // flame
  bestseller: 'M12 22c4.4 0 7-2.9 7-6.6 0-3.3-2-5.6-3.6-7.4-.4 1.6-1.2 2.7-2.3 3.2.2-3.4-1.3-6.4-4.1-8.2.3 3.1-1.2 5-2.7 6.8C4.9 11.5 5 13.2 5 15.4 5 19.1 7.6 22 12 22z',
  // thumbs up
  recommended: 'M7 10v11H3V10h4zm2 11h8.3a2 2 0 002-1.6l1.4-7A2 2 0 0018.7 10H14l.8-4.2A1.5 1.5 0 0013.3 4L9 10v11z',
  // sparkle
  new: 'M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7L12 2zM19 15l1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15z',
  // price tag
  promotion: 'M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9zm4.5-4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
};

/** Label such as "ขายดีที่สุด" or "มาใหม่" with a small icon. Renders nothing when there is no badge. */
export function ItemBadge({ badge, className = '' }: { badge: string | null | undefined; className?: string }) {
  const label = badgeLabel(badge);
  if (!label || !badge) return null;
  return <span className={`item-badge item-badge-${badge} ${className}`.trim()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={badgeIcons[badge]} /></svg>{label}
  </span>;
}

/** Price with the original price struck through and a "-X%" tag during a promotion. */
export function PriceTag({ price, compareAt, freeText = 'ฟรี', className = '' }: { price: number; compareAt?: number | null; freeText?: string; className?: string }) {
  const promo = isOnPromo(price, compareAt);
  return <span className={`price-tag ${promo ? 'is-promo' : ''} ${className}`.trim()}>
    <span className="price-now">{Number(price) > 0 ? formatBaht(price) : freeText}</span>
    {promo && <>
      <s className="price-was">{formatBaht(Number(compareAt))}</s>
      <span className="price-off">ลด {discountPercent(price, compareAt)}%</span>
    </>}
  </span>;
}
