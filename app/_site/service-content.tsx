import type { ReactNode } from 'react';
import InterestButton from '../interest-button';
import WorkPathways from '../work-pathways';
import { OtherServices, TravelServices, UkPrograms } from '../more-services';
import type { ServiceSlug } from '../../lib/site';

const courses = [
  ['01', 'Test Preparation', 'TOEFL · IELTS · CU-TEP · TU-GET · KEPT'],
  ['02', 'Academic & Admission', 'ม.1 / ม.4 · TCAS · NETSAT · TGAT · A-Level'],
  ['03', 'Global Readiness', 'เตรียมภาษาเพื่อเรียนต่อและทำงานต่างประเทศ'],
  ['04', 'Thai for Foreigners', 'คอร์สภาษาไทยสำหรับชาวต่างชาติ'],
];

function English() {
  return <>
    <section className="learning">
      <div className="learning-copy">
        <p className="kicker light"><i/> LEARNING PLUS BY KRU JEW</p>
        <h2>ภาษาอังกฤษ<br/>ที่พาคุณไปถึง<br/><em>เป้าหมายจริง</em></h2>
        <p>เรียนตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ หรือ Hybrid ปรับบทเรียนให้เหมาะกับระดับและเป้าหมายของผู้เรียน</p>
        <div className="learning-levels"><span>Beginner – Advanced</span><span>ม.ต้น</span><span>ม.ปลาย</span><span>บุคคลทั่วไป</span></div>
        <InterestButton className="button white" service="เรียนภาษาอังกฤษ" message="สนใจคอร์สเรียนภาษาอังกฤษกับ Learning Plus by Kru Jew">สอบถามคอร์สเรียน ↗</InterestButton>
      </div>
      <div className="course-list">{courses.map(course => <article className="course" key={course[0]}><b>{course[0]}</b><div><h3>{course[1]}</h3><p>{course[2]}</p></div></article>)}</div>
    </section>
    <section className="section service-formats">
      <div className="heading"><div><p className="kicker"><i/> LEARNING FORMATS</p><h2>รูปแบบการเรียน</h2></div><p>เลือกรูปแบบที่เหมาะกับตารางชีวิตและสไตล์การเรียนของคุณ</p></div>
      <div className="format-grid">{[['ตัวต่อตัว', 'ปรับเนื้อหาและจังหวะตามผู้เรียนคนเดียว'], ['กลุ่มเล็ก', 'เรียนกับเพื่อนในระดับใกล้กัน ฝึกสื่อสารได้มากขึ้น'], ['ออนไลน์', 'เรียนจากที่ไหนก็ได้ผ่านวิดีโอคอล'], ['ออนไซต์ / Hybrid', 'เรียนที่สถาบันในยโสธร หรือผสมกับออนไลน์']].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
  </>;
}

function StudyUk() {
  return <section className="section uk">
    <div className="uk-panel">
      <div className="uk-art"><img src="/the-uk-enhanced.webp" alt="ธงสหราชอาณาจักรและหอนาฬิกาบิ๊กเบน" /></div>
      <div className="uk-copy"><p className="eyebrow">SUMMER UK COURSE</p><h2>เรียนภาษาอังกฤษ<br/>พร้อมใช้ชีวิตจริง<br/>ที่ Cambridge</h2><p>สัมผัสบรรยากาศเมืองมหาวิทยาลัยชั้นนำ เรียนภาษา ทำกิจกรรม และพักกับ Host Family อย่างปลอดภัย</p><div><span>2-3 สัปดาห์</span><span>เรียน 30 ชั่วโมง</span><span>Certificate</span></div></div>
    </div>
    <blockquote>“เราไม่ได้พาไปแค่เรียนภาษา แต่พาไปค้นพบความมั่นใจและโลกใบใหม่”</blockquote>
    <div className="uk-programs-head"><p className="kicker"><i/> STUDY IN UK</p><h3>เลือกโปรแกรมเรียนในอังกฤษ</h3></div>
    <UkPrograms />
  </section>;
}

function WorkAbroad() {
  return <section className="section pathways">
    <div className="heading"><div><p className="kicker"><i/> WORK & TRAVEL ABROAD</p><h2>เลือกเส้นทางที่เหมาะ<br/>กับจังหวะชีวิตคุณ</h2></div><p>เลือกโปรแกรมที่สนใจ ระบบจะกรอกข้อมูลในฟอร์มด้านล่างให้อัตโนมัติ</p></div>
    <WorkPathways />
  </section>;
}

function Travel() {
  return <><TravelServices /><OtherServices /></>;
}

export const serviceContent: Record<ServiceSlug, { kicker: string; intro: string; body: () => ReactNode }> = {
  english: { kicker: 'LEARNING PLUS BY KRU JEW', intro: 'คอร์สภาษาอังกฤษตั้งแต่ Beginner ถึง Advanced สำหรับนักเรียน ม.ต้น ม.ปลาย และบุคคลทั่วไป ทั้งเตรียมสอบและใช้งานจริง', body: English },
  'study-uk': { kicker: 'STUDY IN UK', intro: 'Summer Course 2-3 สัปดาห์ คอร์สภาษาระยะสั้นถึงระยะยาว และคอร์สพัฒนาทักษะเฉพาะทางในประเทศอังกฤษ', body: StudyUk },
  'work-abroad': { kicker: 'WORK ABROAD', intro: 'Seasonal Work 3-6 เดือน, Work & Travel 6 เดือน - 1 ปี และ Skilled Work สัญญาจ้าง 1-2 ปี พร้อมคำแนะนำด้านเอกสาร', body: WorkAbroad },
  travel: { kicker: 'TRAVEL & VISA', intro: 'ทัวร์ส่วนตัวต่างประเทศและในประเทศ ทำวีซ่า จองตั๋วเครื่องบิน รถพร้อมคนขับและไกด์ รวมถึงบริการเสริมแปลเอกสาร ประกัน และที่พัก', body: Travel },
};
