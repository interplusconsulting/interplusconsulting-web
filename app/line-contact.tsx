'use client';

import { useEffect, useState } from 'react';

const lineUrl = 'https://line.me/ti/p/cBuPUGY7jm#~';

export default function LineContact() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  return <>
    <button type="button" className="line-contact" onClick={() => setOpen(true)}>
      <span>LINE</span>ติดต่อผ่าน LINE <b>↗</b>
    </button>

    {open && <div className="line-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="line-modal" role="dialog" aria-modal="true" aria-labelledby="line-modal-title">
        <button type="button" className="line-modal-close" aria-label="ปิด QR Code LINE" onClick={() => setOpen(false)}>×</button>
        <p className="eyebrow">LINE CONTACT</p>
        <h3 id="line-modal-title">สแกนเพื่อเพิ่มเพื่อน</h3>
        <p>สแกน QR Code หรือกดปุ่มด้านล่างเพื่อติดต่อ Inter Plus Consulting ผ่าน LINE</p>
        <img src="/contact/line-qr.jpg" alt="QR Code สำหรับติดต่อ Inter Plus Consulting ผ่าน LINE" />
        <a className="button line-modal-action" href={lineUrl} target="_blank" rel="noreferrer">ติดต่อผ่าน LINE ↗</a>
      </section>
    </div>}
  </>;
}
