'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { smoothScrollToElement } from './smooth-scroll';

const announcements = [
  {
    image: '/announcements/english-m1-m3.jpg',
    fullImage: '/announcements/english-m1-m3.jpg',
    label: 'ENGLISH COURSE · ม.ต้น',
    title: 'คอร์สภาษาอังกฤษ ม.1–ม.3 ภาคเรียนที่ 2/2569',
    description: 'ปูพื้นฐานไวยากรณ์และโครงสร้างภาษา พร้อมเตรียมสอบเข้า ม.4 ห้องพิเศษและโครงการดัง รับจำนวนจำกัด 15 ที่นั่ง',
  },
  {
    image: '/announcements/english-m4-m6.jpg',
    fullImage: '/announcements/english-m4-m6.jpg',
    label: 'ENGLISH COURSE · ม.ปลาย',
    title: 'คอร์สภาษาอังกฤษ ม.4–ม.6 ภาคเรียนที่ 2/2569',
    description: 'ปรับพื้นฐานและเตรียมสอบมหาวิทยาลัย ครอบคลุม TOEFL ITP, IELTS, KEPT, CU-TEP, NETSAT, TGAT และ A-Level รับ 15 ที่นั่ง',
  },
  {
    image: '/announcements/canterbury-summer.jpg',
    fullImage: '/announcements/canterbury-summer.jpg',
    label: 'SUMMER UK 2027',
    title: 'ใช้ชีวิตแบบชาวลอนดอน เรียนภาษาอังกฤษที่ Canterbury',
    description: 'แพ็กเกจ All-inclusive เรียน Speaking for IELTS 30 ชั่วโมง พร้อมที่พัก อาหาร กิจกรรม ทัศนศึกษา ตั๋วเครื่องบินและประกันการเดินทาง',
  },
  {
    image: '/announcements/canterbury-experience.jpg',
    fullImage: '/announcements/canterbury-experience.jpg',
    label: 'LIVE · LEARN · EXPLORE',
    title: 'สัมผัสชีวิตจริงและเรียนรู้ที่ Canterbury',
    description: 'เรียนภาษาอังกฤษผ่านประสบการณ์จริง พัก Residence Apartment ใจกลางเมือง พร้อมกิจกรรมและทัศนศึกษาที่ออกแบบให้เรียนรู้วัฒนธรรมอย่างเต็มที่',
  },
  {
    image: '/announcements/canterbury-payment-plan.jpg',
    fullImage: '/announcements/canterbury-payment-plan.jpg',
    label: 'EDUCATION PLAN · UK 2027',
    title: 'แผนการชำระเงินโปรแกรม Canterbury UK 2027',
    description: 'ราคาพิเศษ 164,000 บาทเมื่อจองล่วงหน้า แบ่งชำระ 3 งวด รวมวีซ่า ที่พัก คอร์สเรียน อาหาร ประกัน และทริปท่องเที่ยว',
  },
];

export default function Announcements() {
  const announcementTrack = useRef<HTMLDivElement>(null);
  const announcementPosition = useRef(0);
  const announcementResetTimer = useRef<number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const activeAnnouncement = announcements[popupIndex];

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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setPopupOpen(true), 2050);
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
      if (preview !== null) setPreview(null);
      else setPopupOpen(false);
    };
    document.addEventListener('keydown', close);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', close);
      document.body.classList.remove('modal-open');
    };
  }, [popupOpen, preview]);

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
        <p>ติดตามโครงการ คอร์สเรียน และโอกาสใหม่จาก Inter Plus Consulting กดที่รูปเพื่อดูประกาศขนาดใหญ่</p>
      </div>
      <div className="announcement-carousel">
        <div className="announcement-carousel-controls" aria-label="เลื่อนดูประกาศ">
          <button type="button" onClick={() => scrollAnnouncements(-1)} aria-label="ดูประกาศก่อนหน้า">←</button>
          <span>เลื่อนดูประกาศ</span>
          <button type="button" onClick={() => scrollAnnouncements(1)} aria-label="ดูประกาศถัดไป">→</button>
        </div>
        <div className="announcement-grid" ref={announcementTrack}>{[...announcements, ...announcements].map((announcement, renderIndex) => {
          const index = renderIndex % announcements.length;
          const isClone = renderIndex >= announcements.length;
          return <article className="announcement-card" id={isClone ? undefined : `announcement-${index}`} aria-hidden={isClone || undefined} key={`${announcement.title}-${renderIndex}`}>
            <button type="button" className="announcement-image" tabIndex={isClone ? -1 : undefined} onClick={() => setPreview(index)} aria-label={`ขยายรูปประกาศ ${announcement.title}`}>
              <img src={announcement.image} alt={announcement.title} />
              <span>ขยายรูป ↗</span>
            </button>
            <div><p className="eyebrow">{announcement.label}</p><h3>{announcement.title}</h3><p>{announcement.description}</p></div>
          </article>
        })}</div>
      </div>
    </section>

    {popupOpen && <div className="announcement-popup-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPopupOpen(false); }}>
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

    {preview !== null && <div className="announcement-lightbox" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPreview(null); }}>
      <figure role="dialog" aria-modal="true" aria-label="รูปประกาศขนาดใหญ่">
        <button type="button" className="announcement-close" aria-label="ปิดรูปประกาศ" onClick={() => setPreview(null)}>×</button>
        <img src={announcements[preview].fullImage} alt={announcements[preview].title} />
        <figcaption>{announcements[preview].title}</figcaption>
      </figure>
    </div>}
  </>;
}
