'use client';

import { useEffect, useState } from 'react';
import { smoothScrollToElement } from './smooth-scroll';

type Service = {
  icon: 'learning' | 'uk' | 'work' | 'travel';
  label: string;
  title: string;
  text: string;
  details: string[];
};

const services: Service[] = [
  { icon: 'learning', label: 'LEARNING PLUS', title: 'เรียนภาษาอังกฤษ', text: 'Beginner ถึง Advanced พร้อมคอร์ส IELTS, TOEFL, CU-TEP, TU-GET, KEP และ TCAS', details: ['เรียนได้ทั้งตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ และ Hybrid', 'เตรียมสอบ IELTS, TOEFL, CU-TEP, TU-GET, KEP และ TCAS', 'ปรับเนื้อหาและตารางเรียนตามระดับและเป้าหมายของผู้เรียน'] },
  { icon: 'uk', label: 'STUDY IN UK', title: 'เรียนต่อประเทศอังกฤษ', text: 'Summer Course และหลักสูตรระยะสั้น-ยาว ตั้งแต่ 1 เดือนถึง 1 ปี', details: ['ช่วยเลือกเมือง สถาบัน และหลักสูตรที่เหมาะสม', 'ดูแลขั้นตอนสมัครเรียน เอกสาร และการเตรียมตัวก่อนเดินทาง', 'มีทั้ง Summer Course และหลักสูตรระยะสั้นถึงระยะยาว'] },
  { icon: 'work', label: 'WORK ABROAD', title: 'ทำงานต่างประเทศ', text: 'Seasonal Work, Work & Travel และโอกาสทำงานสำหรับผู้มีทักษะ', details: ['แนะนำ Seasonal Work, Work & Travel และเส้นทางสำหรับผู้มีทักษะ', 'ตรวจสอบคุณสมบัติและช่วยวางแผนเอกสารที่เกี่ยวข้อง', 'ให้คำแนะนำตามระยะเวลา งบประมาณ และเป้าหมายของผู้สมัคร'] },
  { icon: 'travel', label: 'TRAVEL & VISA', title: 'ท่องเที่ยวและวีซ่า', text: 'วางแผนการเดินทาง วีซ่า ตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์', details: ['บริการวางแผนและยื่นวีซ่าหลากหลายประเภท', 'ประสานงานตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์', 'ออกแบบแผนการเดินทางให้เหมาะกับเวลาและงบประมาณ'] },
];

function ServiceIcon({ type }: { type: Service['icon'] }) {
  if (type === 'learning') return <img src="/service-icons/learning.png" alt="" />;
  if (type === 'uk') return <img src="/service-icons/uk.png" alt="" />;
  if (type === 'work') return <img src="/service-icons/work.png" alt="" />;
  return <img src="/service-icons/travel.png" alt="" />;
}

export default function ServiceCards() {
  const [selected, setSelected] = useState<number | null>(null);
  const [modal, setModal] = useState<Service | null>(null);

  useEffect(() => {
    if (!modal) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setModal(null); };
    document.addEventListener('keydown', close);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', close); document.body.classList.remove('modal-open'); };
  }, [modal]);

  const selectService = (service: Service) => {
    window.dispatchEvent(new CustomEvent('interplus:program-selected', {
      detail: { service: service.title, message: `สนใจบริการ ${service.title}\nรายละเอียด: ${service.text}` },
    }));
    smoothScrollToElement('#contact');
  };

  return <>
    <div className="service-grid">{services.map((service, index) => {
      const isSelected = selected === index;
      return <article className={`service-card${isSelected ? ' selected' : ''}`} key={service.title}>
        <button className="service-card-trigger" type="button" aria-expanded={isSelected} onClick={() => setSelected(isSelected ? null : index)}>
          <div className="service-card-top"><span className="service-icon"><ServiceIcon type={service.icon} /></span><small>0{index + 1}</small></div>
          <label>{service.label}</label>
          <h3>{service.title}</h3>
          <p>{service.text}</p>
          <span className="service-select-hint">เลือกเพื่อดูตัวเลือก <b>＋</b></span>
        </button>
        <div className="service-actions" aria-hidden={!isSelected}>
          <button type="button" className="service-detail-button" onClick={() => setModal(service)}>ดูรายละเอียด</button>
          <button type="button" className="service-interest-button" onClick={() => selectService(service)}>สนใจโปรแกรมนี้ ↗</button>
        </div>
      </article>;
    })}</div>

    {modal && <div className="service-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}>
      <section className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
        <button type="button" className="service-modal-close" aria-label="ปิดหน้าต่าง" onClick={() => setModal(null)}>×</button>
        <span className="service-icon"><ServiceIcon type={modal.icon} /></span>
        <p className="eyebrow">{modal.label}</p>
        <h3 id="service-modal-title">{modal.title}</h3>
        <p>{modal.text}</p>
        <ul>{modal.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
        <button type="button" className="button" onClick={() => { setModal(null); selectService(modal); }}>สนใจโปรแกรมนี้ ↗</button>
      </section>
    </div>}
  </>;
}
