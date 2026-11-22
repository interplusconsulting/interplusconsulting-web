import LoadingIntro from './loading-intro';
import ExperienceGallery from './experience-gallery';
import ServiceCards from './service-cards';
import Announcements from './announcements';
import { Faq } from './more-services';
import SiteChrome from './_site/site-chrome';
import ContactSection from './_site/contact-section';
import GoogleReviews from './_site/google-reviews';
import OnlineCourses from './_site/online-courses';
import { getHiddenSections } from '../lib/site-settings.server';
import type { SectionKey } from '../lib/site-sections';

export const revalidate = 43200; // refresh Google reviews twice a day

const steps = [
  ['01', 'คุยกับที่ปรึกษา', 'เล่าเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ'],
  ['02', 'ออกแบบแผนเฉพาะคุณ', 'ทีมงานคัดหลักสูตร โปรแกรม หรือเส้นทางที่เหมาะสม'],
  ['03', 'เตรียมเอกสาร', 'ดูแลใบสมัคร วีซ่า เอกสารรับรอง และการจองต่าง ๆ'],
  ['04', 'เดินทางอย่างมั่นใจ', 'มีทีมงานประสานงานและให้คำแนะนำตลอดทริป'],
];

const iconProps = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const stepIcons = [
  <svg key="talk" {...iconProps}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>,
  <svg key="plan" {...iconProps}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>,
  <svg key="docs" {...iconProps}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13l2 2 4-4"/></svg>,
  <svg key="fly" {...iconProps}><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.3 1.3L10 11l-3 3H4.5l-1 1 3.5 1.5L8.5 20l1-1v-2.5l3-3 3.5 6.5 1.8-1.3Z"/></svg>,
];

const experiencePhotos = [
  { src: '/experience/experience-02.webp', alt: 'ครูผู้สอน Inter Plus Consulting', caption: 'ครูผู้สอน', kind: 'teacher' },
  { src: '/experience/experience-02-classroom.webp', alt: 'บรรยากาศภายในห้องเรียน', caption: 'บรรยากาศการเรียน', kind: 'classroom' },
  { src: '/experience/experience-08.webp', alt: 'บรรยากาศกิจกรรมกลุ่มของผู้เรียน', caption: 'กิจกรรมของผู้เรียน', kind: 'group' },
  { src: '/experience/experience-05.webp', alt: 'บรรยากาศการเดินทางและกิจกรรมต่างประเทศ', caption: 'ประสบการณ์ต่างประเทศ', kind: 'travel-experience' },
  { src: '/experience/experience-03.webp', alt: 'ทัศนศึกษาที่ศาลาว่าการเมืองในต่างประเทศ', caption: 'ทัศนศึกษา', kind: 'field-trip' },
  { src: '/experience/experience-06.webp', alt: 'ใช้ชีวิตและเดินทางด้วยรถสาธารณะในต่างประเทศ', caption: 'ใช้ชีวิตจริงในต่างประเทศ', kind: 'city-life' },
];

export default async function Home() {
  const hidden = await getHiddenSections();
  const show = (key: SectionKey) => !hidden.includes(key);
  return <SiteChrome before={<LoadingIntro />}>
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="kicker"><i/> INTERNATIONAL EDUCATION & CAREER GUIDANCE</p>
        <h1>เปิดประตูสู่<br/><em>โอกาสใหม่</em><br/>ทั่วโลก</h1>
        <p className="lead">วางแผนการเรียน การทำงาน และการเดินทางต่างประเทศอย่างมั่นใจ ด้วยทีมที่ปรึกษาที่ดูแลคุณทุกขั้นตอน</p>
        <div className="actions"><a className="button" href="#contact">เริ่มวางแผนกับเรา ↗︎</a>{show('services') && <a className="text-link" href="#services">ดูบริการทั้งหมด ↓</a>}</div>
        <div className="trust"><div><b>10+</b><span>ปีแห่งประสบการณ์</span></div><div><b>4</b><span>บริการหลักครบวงจร</span></div><div><b>1:1</b><span>ดูแลแบบรายบุคคล</span></div></div>
      </div>
      <img className="hero-mobile-img" src="/hero-study-abroad.webp" alt="" />
    </section>

    {show('services') && <section className="section" id="services"><div className="heading"><div><p className="kicker"><i/> OUR CORE SERVICES</p><h2>ทุกเป้าหมายของคุณ<br/><em>ไปได้ไกลกว่าเดิม</em></h2></div><p>บริการแบบ One-Stop Service ตั้งแต่ค้นหาเส้นทางที่ใช่ เตรียมเอกสาร จนถึงวันที่คุณออกเดินทาง</p></div><ServiceCards /></section>}

    {(show('announcements') || show('announcement_popup')) && <Announcements showList={show('announcements')} showPopup={show('announcement_popup')} />}

    {show('courses') && <OnlineCourses />}

    {show('about') && <section className="section about" id="about">
      <div className="about-art"><img src="/about-consultation.webp" alt="ที่ปรึกษา Inter Plus กำลังวางแผนการศึกษาต่อต่างประเทศกับผู้เรียน" /></div>
      <div className="about-copy">
        <p className="kicker"><i/> WHY INTER PLUS</p>
        <h2>คำแนะนำที่ดี<br/>เปลี่ยนอนาคตได้</h2>
        <p>Inter Plus Consulting เชื่อว่าทุกคนมีเส้นทางที่เหมาะกับตัวเอง เราจึงเริ่มจากการฟัง ทำความเข้าใจ และวางแผนอย่างตรงจุด ไม่ขายฝัน แต่ช่วยให้คุณเห็นทางเลือกที่เป็นไปได้จริง</p>
        <ul><li>ทีมงานมีประสบการณ์และเข้าใจระบบต่างประเทศ</li><li>ดูแลครบตั้งแต่เลือกโปรแกรมจนถึงวันเดินทาง</li><li>ให้คำปรึกษาอย่างจริงใจและเหมาะกับแต่ละบุคคล</li></ul>
        <div className="partner-inline"><span>สถาบันที่ร่วมงานกับเรา</span><img src="/learning-plus-partner.webp" alt="Learning Plus By Kru Jew" /><img src="/stafford-house-partner.webp" alt="Stafford House Study Holidays" /></div>
      </div>
    </section>}

    {show('process') && <section className="section process" id="process"><div className="heading"><div><p className="kicker light"><i/> SIMPLE PROCESS</p><h2>4 ขั้นตอน<br/>สู่เป้าหมายของคุณ</h2></div><p>เรื่องต่างประเทศไม่จำเป็นต้องซับซ้อน เมื่อมีคนที่เข้าใจคอยเดินไปกับคุณ</p></div><ol className="steps">{steps.map((s, index)=><li key={s[0]}><span className="step-icon" aria-hidden="true">{stepIcons[index]}</span><b>{s[0]}</b><h3>{s[1]}</h3><p>{s[2]}</p></li>)}</ol></section>}

    {show('gallery') && <section className="section experience-gallery"><div className="gallery-heading"><div><p className="kicker"><i/> OUR GALLERY</p><h2>ภาพบรรยากาศ</h2></div><p>บรรยากาศการเรียนและกิจกรรมที่ช่วยเปิดโลกใหม่ให้ผู้เรียนของเรา</p></div><ExperienceGallery photos={experiencePhotos}/></section>}

    {show('reviews') && <GoogleReviews />}

    {show('faq') && <Faq />}

    <ContactSection showMap={show('map')} />
  </SiteChrome>;
}
