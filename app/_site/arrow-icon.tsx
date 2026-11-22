export default function ArrowIcon({ direction = 'diagonal' }: { direction?: 'diagonal' | 'down' }) {
  return <svg className="site-arrow-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d={direction === 'down' ? 'M10 4v11m-4-4 4 4 4-4' : 'M5 15 15 5M6 5h9v9'}
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
