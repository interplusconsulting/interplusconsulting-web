'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { smoothScrollToElement } from './smooth-scroll';
import { initialAnnouncementData, type Announcement } from '../lib/announcement-data';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncementData);
  const announcementTrack = useRef<HTMLDivElement>(null);
  const announcementPosition = useRef(0);
  const announcementResetTimer = useRef<number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [preview, setPreview] = useState<{ index: number; image: number } | null>(null);
  const [expandedImage, setExpandedImage] = useState(false);
  const activeAnnouncement = announcements[popupIndex];
  const previewAnnouncement = preview === null ? null : announcements[preview.index];

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const refresh = async () => {
      try {
        const response = await fetch('/api/local-announcements', { cache: 'no-store' });
        if (!response.ok) return;
        const items: Announcement[] = await response.json();
        setAnnouncements(items);
        setPopupIndex(0);
        announcementPosition.current = 0;
      } catch { /* Keep bundled content if the local API is unavailable. */ }
    };
    void refresh();
    const channel = new BroadcastChannel('local-announcements');
    channel.onmessage = () => { void refresh(); };
    window.addEventListener('focus', refresh);
    return () => { channel.close(); window.removeEventListener('focus', refresh); };
  }, []);

  const moveAnnouncementTrack = useCallback((direction: number) => {
    const track = announcementTrack.current;
    const card = track?.querySelector<HTMLElement>('.announcement-card');
    if (!track || !card) return;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || '0');
    const step = card.offsetWidth + gap;
    if (direction < 0 && announcementPosition.current === 0) {
      announcementPosition.current = announcements.length;
      track.scrollLeft = step * announcements.length;
    }
    announcementPosition.current += direction;
    track.scrollTo({ left: step * announcementPosition.current, behavior: 'smooth' });
    if (announcementPosition.current >= announcements.length) {
      if (announcementResetTimer.current !== null) window.clearTimeout(announcementResetTimer.current);
      announcementResetTimer.current = window.setTimeout(() => {
        announcementPosition.current = 0;
        track.scrollLeft = 0;
      }, 850);
    }
  }, [announcements.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => { if (initialAnnouncementData.length) setPopupOpen(true); }, 2050);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const track = announcementTrack.current;
      const mouseIsHovering = window.matchMedia('(hover: hover)').matches && track?.matches(':hover');
      if (!track || document.hidden || mouseIsHovering || track.contains(document.activeElement)) return;
      moveAnnouncementTrack(1);
    }, 4200);
    return () => {
      window.clearInterval(timer);
      if (announcementResetTimer.current !== null) window.clearTimeout(announcementResetTimer.current);
    };
  }, [moveAnnouncementTrack]);

  useEffect(() => {
    if (!popupOpen && preview === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (expandedImage) setExpandedImage(false);
      else if (preview !== null) setPreview(null);
      else setPopupOpen(false);
    };
    document.addEventListener('keydown', close);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', close);
      document.body.classList.remove('modal-open');
    };
  }, [popupOpen, preview, expandedImage]);

  const closePreview = () => {
    setExpandedImage(false);
    setPreview(null);
  };

  const showAllAnnouncements = () => {
    setPopupOpen(false);
    window.setTimeout(() => smoothScrollToElement('#announcements'), 80);
  };

  const showAnnouncement = (index: number) => {
    setPopupOpen(false);
    window.setTimeout(() => smoothScrollToElement(`#announcement-${index}`), 80);
  };

  const changePopup = (direction: number) => {
    setPopupIndex(current => (current + direction + announcements.length) % announcements.length);
  };

  const scrollAnnouncements = (direction: number) => moveAnnouncementTrack(direction);

  return <>
    <section className="section announcements" id="announcements">
      <div className="heading">
        <div><p className="kicker"><i/> NEWS & ANNOUNCEMENTS</p><h2>ข่าวสารและ<br/><em>ประกาศล่าสุด</em></h2></div>
        <p>ติดตามโครงการ คอร์สเรียน และโอกาสใหม่จาก Inter Plus Consulting กดที่ประกาศเพื่อดูรายละเอียด</p>
      </div>
      <div className="announcement-carousel">
        <div className="announcement-carousel-controls" aria-label="เลื่อนดูประกาศ">
          <button type="button" onClick={() => scrollAnnouncements(-1)} aria-label="ดูประกาศก่อนหน้า">←</button>
          <span>เลื่อนดูประกาศ</span>
          <button type="button" onClick={() => scrollAnnouncements(1)} aria-label="ดูประกาศถัดไป">→</button>
        </div>
        <div className="announcement-grid" ref={announcementTrack}>{announcements.length === 0 && <p>ยังไม่มีประกาศ</p>}{[...announcements, ...announcements].map((announcement, renderIndex) => {
          const index = renderIndex % announcements.length;
          const isClone = renderIndex >= announcements.length;
          return <article className="announcement-card" id={isClone ? undefined : `announcement-${index}`} aria-hidden={isClone || undefined} key={`${announcement.id}-${renderIndex}`}>
            <button type="button" className="announcement-card-button" tabIndex={isClone ? -1 : undefined} onClick={() => setPreview({ index, image: 0 })} aria-label={`ดูรายละเอียดประกาศ ${announcement.title}`}>
              <span className="announcement-image"><img src={announcement.image} alt="" /><span>ดูรายละเอียด ↗</span></span>
              <span className="announcement-card-copy"><span className="eyebrow">{announcement.label}</span><strong>{announcement.title}</strong><span>{announcement.description}</span></span>
            </button>
          </article>
        })}</div>
      </div>
    </section>

    {popupOpen && activeAnnouncement && <div className="announcement-popup-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPopupOpen(false); }}>
      <section className="announcement-popup" role="dialog" aria-modal="true" aria-labelledby="announcement-popup-title">
        <button type="button" className="announcement-close" aria-label="ปิดประกาศ" onClick={() => setPopupOpen(false)}>×</button>
        <button type="button" className="announcement-popup-image" onClick={() => showAnnouncement(popupIndex)} aria-label="ไปยังประกาศ">
          <img src={activeAnnouncement.image} alt={activeAnnouncement.title} />
          <span>ไปยังประกาศ ↓</span>
        </button>
        <div className="announcement-popup-copy">
          <p className="eyebrow">ประกาศ · {activeAnnouncement.label}</p>
          <h3 id="announcement-popup-title">{activeAnnouncement.title}</h3>
          <p>{activeAnnouncement.description}</p>
          {announcements.length > 1 && <div className="announcement-pager" aria-label="เลือกประกาศ">
            <button type="button" onClick={() => changePopup(-1)} aria-label="ประกาศก่อนหน้า">←</button>
            <span>{popupIndex + 1} / {announcements.length}</span>
            <button type="button" onClick={() => changePopup(1)} aria-label="ประกาศถัดไป">→</button>
          </div>}
          <div className="announcement-popup-actions">
            <button type="button" className="button secondary" onClick={showAllAnnouncements}>ดูประกาศทั้งหมด</button>
          </div>
        </div>
      </section>
    </div>}

    {preview !== null && <div className="announcement-lightbox" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closePreview(); }}>
      <figure className={previewAnnouncement?.details ? 'announcement-detail-dialog' : undefined} role="dialog" aria-modal="true" aria-label={`รายละเอียดประกาศ ${previewAnnouncement?.title}`}>
        <button type="button" className="announcement-close" aria-label="ปิดรายละเอียดประกาศ" onClick={closePreview}>×</button>
        <div className="announcement-detail-image"><button type="button" className="announcement-expand-image" onClick={() => setExpandedImage(true)} aria-label={`ขยายรูป ${previewAnnouncement?.title}`} title="คลิกเพื่อขยายรูป"><img src={previewAnnouncement?.gallery?.[preview.image] ?? previewAnnouncement?.fullImage} alt={`${previewAnnouncement?.title}${preview.image ? ' — แผนการเดินทาง' : ''}`} /><span>ขยายรูป ↗</span></button>
          {previewAnnouncement?.gallery && <div className="announcement-gallery-controls" aria-label="ภาพประกาศและแผนการเดินทาง">
            {previewAnnouncement.gallery.map((_, image) => <button type="button" className={preview.image === image ? 'active' : ''} key={image} onClick={() => setPreview({ index: preview.index, image })}>{image === 0 ? 'ภาพโปรโมชัน' : 'แผนการเดินทาง'}</button>)}
          </div>}
        </div>
        <figcaption><h3>{previewAnnouncement?.title}</h3>{previewAnnouncement?.details && <div className="announcement-details">{previewAnnouncement.details.map(detail => <p className={detail.startsWith('•') ? 'announcement-detail-bullet' : detail.startsWith('#') ? 'announcement-detail-tags' : detail.startsWith('ราคาพิเศษ') ? 'announcement-detail-price' : undefined} key={detail}>{detail}</p>)}</div>}</figcaption>
      </figure>
    </div>}

    {expandedImage && preview !== null && previewAnnouncement && <div className="announcement-expanded-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setExpandedImage(false); }}>
      <div className="announcement-expanded-dialog" role="dialog" aria-modal="true" aria-label={`รูปประกาศขนาดใหญ่ ${previewAnnouncement.title}`}>
        <button type="button" className="announcement-expanded-close" onClick={() => setExpandedImage(false)} aria-label="ปิดรูปขนาดใหญ่">×</button>
        <img src={previewAnnouncement.gallery?.[preview.image] ?? previewAnnouncement.fullImage} alt={`${previewAnnouncement.title}${preview.image ? ' — แผนการเดินทาง' : ''}`} />
        {previewAnnouncement.gallery.length > 1 && <div className="announcement-expanded-controls">
          <button type="button" onClick={() => setPreview({ index: preview.index, image: (preview.image - 1 + previewAnnouncement.gallery.length) % previewAnnouncement.gallery.length })} aria-label="รูปก่อนหน้า">←</button>
          <span>{preview.image + 1} / {previewAnnouncement.gallery.length}</span>
          <button type="button" onClick={() => setPreview({ index: preview.index, image: (preview.image + 1) % previewAnnouncement.gallery.length })} aria-label="รูปถัดไป">→</button>
        </div>}
      </div>
    </div>}
  </>;
}
