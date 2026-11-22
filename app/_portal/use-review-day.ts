'use client';

import { useEffect, useState } from 'react';
import { bangkokReviewDay, msUntilNextReviewDay } from '../../lib/review-age';

export function useReviewDay() {
  const [day, setDay] = useState(bangkokReviewDay);
  useEffect(() => {
    let timer: number;
    function refresh() {
      window.clearTimeout(timer);
      setDay(bangkokReviewDay());
      timer = window.setTimeout(refresh, msUntilNextReviewDay() + 50);
    }
    refresh();
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return day;
}
