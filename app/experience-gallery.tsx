'use client';

import { useEffect, useState } from 'react';

type Photo = { src: string; alt: string; caption: string; kind: string };

export default function ExperienceGallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<number | null>(null);

  const move = (step: number) => setActive(current => current === null ? null : (current + step + photos.length) % photos.length);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };
    document.body.classList.add('lightbox-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('lightbox-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return <>
    <div className="photo-grid">{photos.map((photo, index) =>
      <figure className={`photo-item photo-${index + 1} ${photo.kind}`} key={photo.src}>
        <button type="button" onClick={() => setActive(index)} aria-label={`เปิดดูภาพ: ${photo.caption}`}>
          <img className="photo-backdrop" src={photo.src} alt="" aria-hidden="true" loading="lazy"/>
          <img className="photo-main" src={photo.src} alt={photo.alt} loading="lazy"/>
          <figcaption><span>{String(index + 1).padStart(2, '0')}</span>{photo.caption}<b>ขยาย ↗</b></figcaption>
        </button>
      </figure>
    )}</div>
    {active !== null && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="ตัวอย่างภาพขนาดใหญ่" onMouseDown={event => { if (event.target === event.currentTarget) setActive(null); }}>
      <button className="lightbox-close" type="button" onClick={() => setActive(null)} aria-label="ปิดรูปตัวอย่าง">×</button>
      <button className="lightbox-prev" type="button" onClick={() => move(-1)} aria-label="ภาพก่อนหน้า">←</button>
      <div className="lightbox-content">
        <img src={photos[active].src} alt={photos[active].alt}/>
        <p><span>{String(active + 1).padStart(2, '0')}</span>{photos[active].caption}</p>
      </div>
      <button className="lightbox-next" type="button" onClick={() => move(1)} aria-label="ภาพถัดไป">→</button>
    </div>}
  </>;
}
