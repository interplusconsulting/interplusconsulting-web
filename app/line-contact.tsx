'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import ArrowIcon from './_site/arrow-icon';

const lineUrl = 'https://line.me/ti/p/cBuPUGY7jm#~';

type Props = { className?: string; children?: ReactNode };

export default function LineContact({ className = 'line-contact', children }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const contactLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const returnFocus = trigger.current;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('modal-open');
      returnFocus?.focus();
    };
  }, [open]);

  return <>
    <button ref={trigger} type="button" className={className} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      {children ?? <><span>LINE</span>ติดต่อผ่าน LINE <b>↗︎</b></>}
    </button>

    {open && <div className="announcement-popup-backdrop line-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="announcement-popup line-modal" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`} onKeyDown={event => {
          if (event.key !== 'Tab') return;
          if (event.shiftKey && event.target === closeButton.current) {
            event.preventDefault();
            contactLink.current?.focus();
          } else if (!event.shiftKey && event.target === contactLink.current) {
            event.preventDefault();
            closeButton.current?.focus();
          }
        }}>
        <button ref={closeButton} type="button" className="announcement-close" aria-label="ปิด QR Code LINE" onClick={() => setOpen(false)}>×</button>
        <div className="line-modal-qr">
          <img src="/contact/line-qr.jpg" alt="QR Code สำหรับติดต่อ Inter Plus Consulting ผ่าน LINE" />
        </div>
        <div className="announcement-popup-copy line-modal-copy">
          <p className="announcement-popup-badge"><b>LINE</b></p>
          <h3 id={`${id}-title`}>สแกนเพื่อเพิ่มเพื่อน</h3>
          <p id={`${id}-description`} className="announcement-popup-text">สแกน QR Code หรือกดปุ่มด้านล่างเพื่อติดต่อ Inter Plus Consulting ผ่าน LINE</p>
          <a ref={contactLink} className="button line-modal-action" href={lineUrl} target="_blank" rel="noreferrer"><span>ติดต่อผ่าน LINE</span><ArrowIcon /></a>
        </div>
      </section>
    </div>}
  </>;
}
