'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const scrollUp = () => {
    const start = window.scrollY;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0);
      return;
    }

    const duration = Math.min(1500, Math.max(950, start * 0.28));
    const startedAt = performance.now();
    const easeInOutCubic = (progress: number) => progress < .5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      window.scrollTo(0, Math.round(start * (1 - easeInOutCubic(progress))));
      if (progress < 1) window.requestAnimationFrame(animate);
    };
    window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  return <button
    className={`scroll-to-top${visible ? ' visible' : ''}`}
    type="button"
    aria-label="เลื่อนกลับขึ้นด้านบน"
    title="กลับขึ้นด้านบน"
    onClick={scrollUp}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 10 6-6 6 6M12 4v16" />
    </svg>
  </button>;
}
