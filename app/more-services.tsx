import InterestButton from './interest-button';

const ukPrograms = [
  { code: 'UK 01', title: 'Summer UK Course', duration: '2-3 สัปดาห์', text: 'โปรแกรมซัมเมอร์ระยะสั้น ไปได้ทั้งแบบเดี่ยวและแบบกลุ่ม เรียนภาษาพร้อมทำกิจกรรมและทัศนศึกษา' },
  { code: 'UK 02', title: 'Short-term & Long-term Language Courses', duration: '1-3 เดือน / 6 เดือน - 1 ปี', text: 'คอร์สเรียนภาษาระยะสั้นถึงระยะยาวแบบเรียนเดี่ยว เลือกระยะเวลาได้ตามความต้องการ' },
  { code: 'UK 03', title: 'Upskill & Specialized Courses', duration: '1-3 เดือน / 6 เดือน - 1 ปี', text: 'คอร์สพัฒนาทักษะเฉพาะทางในประเทศอังกฤษ สำหรับผู้ที่ต้องการต่อยอดความรู้และประสบการณ์' },
];

const travelGroups = [
  { label: 'INTERNATIONAL TRAVEL', title: 'การเดินทางต่างประเทศ', items: [
    ['Private Group Tour', 'จัดทัวร์กลุ่มส่วนตัวต่างประเทศ พร้อมทีมงานให้คำปรึกษาตลอดทริป'],
    ['Visa & Travel Planning', 'บริการวางแผนการเดินทาง และรับทำวีซ่าทุกประเภท'],
    ['Flight Booking', 'บริการจองตั๋วเครื่องบินครอบคลุมทุกเส้นทางทั่วโลก'],
  ] },
  { label: 'DOMESTIC TRAVEL', title: 'การท่องเที่ยวในประเทศ', items: [
    ['Thailand Private Tour', 'รับจัดทัวร์ในประเทศแบบ Solo และ Group ส่วนตัว'],
    ['Transport & Guide', 'บริการรถนำเที่ยวพร้อมคนขับ และไกด์นำเที่ยวครอบคลุมทุกจังหวัดในประเทศไทย'],
  ] },
];

const otherServices = [
  ['01', 'แปลและรับรองเอกสาร', 'สำหรับการยื่นวีซ่า สมัครเรียน หรือสมัครงานต่างประเทศ'],
  ['02', 'ประกันการเดินทาง', 'ประกันเดินทางต่างประเทศ และประกันสุขภาพสำหรับนักเรียน'],
  ['03', 'จองที่พักและหอพักนักเรียน', 'ช่วยหาที่พักที่ปลอดภัย ใกล้มหาวิทยาลัยหรือสถานที่ทำงาน'],
];

const faqs = [
  ['ปรึกษาครั้งแรกมีค่าใช้จ่ายไหม?', 'ไม่มีค่าใช้จ่าย ทีมที่ปรึกษาจะคุยเรื่องเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ เพื่อช่วยวางแผนเบื้องต้นให้ก่อน'],
  ['เรียนภาษาอังกฤษกับ Learning Plus ได้ตั้งแต่ระดับไหน?', 'รับตั้งแต่ระดับ Beginner ถึง Advanced ทั้งนักเรียน ม.ต้น ม.ปลาย และบุคคลทั่วไป เลือกเรียนได้ทั้งตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ หรือไฮบริด'],
  ['Summer UK Course ใช้เวลากี่สัปดาห์ ไปคนเดียวได้ไหม?', 'โปรแกรมซัมเมอร์ใช้เวลาประมาณ 2-3 สัปดาห์ สมัครได้ทั้งแบบเดี่ยวและแบบกลุ่ม'],
  ['โครงการทำงานต่างประเทศมีระยะเวลาเท่าไร?', 'Seasonal Work ประมาณ 3-6 เดือน, Work & Travel ประมาณ 6 เดือน - 1 ปี และ Skilled Work สัญญาจ้างระยะยาว 1-2 ปี'],
  ['ยื่นวีซ่าต้องใช้เอกสารอะไรบ้าง?', 'เอกสารขึ้นอยู่กับประเทศและประเภทวีซ่า หลังจากปรึกษา ทีมงานจะแจ้งรายการเอกสารที่ต้องเตรียมและช่วยตรวจสอบก่อนยื่น'],
  ['นอกจากเรียนและเดินทาง มีบริการอะไรอีกบ้าง?', 'มีบริการแปลและรับรองเอกสาร ประกันการเดินทางและประกันสุขภาพนักเรียน รวมถึงช่วยจองที่พักหรือหอพักนักเรียน'],
];

export function UkPrograms() {
  return <div className="uk-programs">{ukPrograms.map(program => <article key={program.code}>
    <small>{program.code}</small>
    <h3>{program.title}</h3>
    <b>{program.duration}</b>
    <p>{program.text}</p>
    <InterestButton className="program-interest" service="เรียนต่อประเทศอังกฤษ" message={`สนใจโปรแกรม ${program.title}\nระยะเวลา: ${program.duration}`}>สนใจโปรแกรมนี้ ↗︎</InterestButton>
  </article>)}</div>;
}

export function TravelServices() {
  return <section className="travel-services" id="travel">
    <div className="travel-head"><div><p className="kicker light"><i/> TRAVEL WITH CONFIDENCE</p><h2>พร้อมออกเดินทาง<br/>แบบไม่ต้องกังวล?</h2></div><p>วางแผนทริป ทำวีซ่า จองตั๋ว ไปจนถึงรถและไกด์ ทั้งต่างประเทศและในประเทศไทย</p></div>
    <div className="travel-groups">{travelGroups.map(group => <article key={group.label}>
      <small>{group.label}</small>
      <h3>{group.title}</h3>
      <ul>{group.items.map(([name, text]) => <li key={name}><b>{name}</b><span>{text}</span></li>)}</ul>
      <InterestButton className="program-interest" service="ท่องเที่ยวและวีซ่า" message={`สนใจบริการ${group.title}`}>สอบถามบริการ ↗︎</InterestButton>
    </article>)}</div>
  </section>;
}

export function OtherServices() {
  return <section className="section other-services" id="other-services">
    <div className="heading"><div><p className="kicker"><i/> OTHER SERVICES</p><h2>บริการเสริม<br/><em>ครบจบในที่เดียว</em></h2></div><p>ดูแลรายละเอียดที่มักถูกมองข้าม เพื่อให้การเรียน การทำงาน และการเดินทางของคุณราบรื่นขึ้น</p></div>
    <div className="other-grid">{otherServices.map(([no, title, text]) => <article key={no}>
      <b>{no}</b>
      <h3>{title}</h3>
      <p>{text}</p>
      <InterestButton className="program-interest" service="บริการอื่นๆ" message={`สนใจบริการ${title}`}>สอบถามบริการ ↗︎</InterestButton>
    </article>)}</div>
  </section>;
}

export function Faq() {
  return <section className="section faq" id="faq">
    <div className="faq-intro"><p className="kicker"><i/> FAQS</p><h2>คำถาม<br/>ที่พบบ่อย</h2><p>ไม่เจอคำตอบที่ต้องการ? ทักมาคุยกับทีมที่ปรึกษาได้เลย</p><a className="button" href="#contact">ถามทีมที่ปรึกษา ↗︎</a></div>
    <div className="faq-list">{faqs.map(([q, a]) => <details key={q}><summary><span>{q}</span><b aria-hidden="true">+</b></summary><p>{a}</p></details>)}</div>
  </section>;
}
