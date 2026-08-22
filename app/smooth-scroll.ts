export function smoothScrollTo(targetY: number) {
  const start = window.scrollY;
  const distance = targetY - start;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, targetY);
    return;
  }

  const duration = Math.min(1600, Math.max(950, Math.abs(distance) * .28));
  const startedAt = performance.now();
  const easeInOutCubic = (progress: number) => progress < .5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const animate = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    window.scrollTo(0, Math.round(start + distance * easeInOutCubic(progress)));
    if (progress < 1) window.requestAnimationFrame(animate);
  };
  window.requestAnimationFrame(animate);
}

export function smoothScrollToElement(selector: string, offset = 88) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return;
  smoothScrollTo(Math.max(0, window.scrollY + element.getBoundingClientRect().top - offset));
}
