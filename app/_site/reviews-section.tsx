'use client';

import { useEffect, useState } from 'react';
import { safeHttpUrl } from '../../lib/media';
import { contact } from '../../lib/site';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { Review } from '../../lib/types';
import { formatReviewAge } from '../../lib/review-age';
import { useReviewDay } from '../_portal/use-review-day';

export type GoogleReview = { author: string; authorUrl: string; photo: string; text: string; when: string };
export type GoogleSummary = { rating: number; count: number; url: string } | null;

function Stars({ value }: { value: number }) {
  return <span className="review-stars" aria-label={`${value} ดาว`}>{'★★★★★'.slice(0, Math.round(value))}</span>;
}

/** Shows 5-star reviews: ones admins copied from Google Maps (database) plus, when configured, ones fetched from Google. */
export default function ReviewsSection({ google, summary }: { google: GoogleReview[]; summary: GoogleSummary }) {
  const [manual, setManual] = useState<Review[]>([]);
  const today = useReviewDay();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase().from('reviews').select('*').eq('is_published', true).eq('rating', 5).order('position').order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => setManual((data as Review[]) ?? []));
  }, []);

  const manualTexts = new Set(manual.map(review => review.body.trim()));
  const fromGoogle = google.filter(review => !manualTexts.has(review.text.trim())); // avoid showing the same review twice
  if (manual.length === 0 && fromGoogle.length === 0) return null;

  return <section className="section reviews" id="reviews">
    <div className="heading">
      <div><p className="kicker"><i/> REVIEWS</p><h2>เสียงจากผู้ใช้บริการ</h2></div>
      {summary
        ? <a className="review-summary" href={summary.url} target="_blank" rel="noreferrer"><b>{summary.rating.toFixed(1)}</b><span><Stars value={summary.rating} /><small>จาก {summary.count} รีวิวบน Google ↗︎</small></span></a>
        : <a className="review-summary" href={contact.mapLink} target="_blank" rel="noreferrer"><span><Stars value={5} /><small>ดูรีวิวทั้งหมดบน Google Maps ↗︎</small></span></a>}
    </div>
    <div className="review-grid">
      {manual.map(review => {
        const link = safeHttpUrl(review.review_url);
        return <figure className="review-card" key={review.id}>
          <Stars value={5} />
          <blockquote>{review.body}</blockquote>
          <figcaption>
            <span className="review-avatar" aria-hidden="true">{review.author_name.trim().slice(0, 1).toUpperCase()}</span>
            <span>{link ? <a href={link} target="_blank" rel="noreferrer">{review.author_name}</a> : review.author_name}<small>{[formatReviewAge(review.review_date, today), `รีวิวบน ${review.source}`].filter(Boolean).join(' · ')}</small></span>
          </figcaption>
        </figure>;
      })}
      {fromGoogle.map((review, index) => <figure className="review-card" key={`g-${index}`}>
        <Stars value={5} />
        <blockquote>{review.text}</blockquote>
        <figcaption>
          {review.photo ? <img src={review.photo} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" /> : <span className="review-avatar" aria-hidden="true">{review.author.slice(0, 1)}</span>}
          <span>{review.authorUrl ? <a href={review.authorUrl} target="_blank" rel="noreferrer">{review.author}</a> : review.author}<small>{review.when} · รีวิวบน Google</small></span>
        </figcaption>
      </figure>)}
    </div>
  </section>;
}
