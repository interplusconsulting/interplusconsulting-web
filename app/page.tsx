import LoadingIntro from './loading-intro';
import LanguageSwitcher from './language-switcher';
import WorkPathways from './work-pathways';
import MobileMenu from './mobile-menu';
import ExperienceGallery from './experience-gallery';
import ContactForm from './contact-form';
import ServiceCards from './service-cards';
import ScrollToTop from './scroll-to-top';
import Announcements from './announcements';
import LineContact from './line-contact';

const steps = [
  ['01', 'คุยกับที่ปรึกษา', 'เล่าเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ'],
  ['02', 'ออกแบบแผนเฉพาะคุณ', 'ทีมงานคัดหลักสูตร โปรแกรม หรือเส้นทางที่เหมาะสม'],
  ['03', 'เตรียมเอกสาร', 'ดูแลใบสมัคร วีซ่า เอกสารรับรอง และการจองต่าง ๆ'],
  ['04', 'เดินทางอย่างมั่นใจ', 'มีทีมงานประสานงานและให้คำแนะนำตลอดทริป'],
];

const experiencePhotos = [
  { src: '/experience/experience-02.webp', alt: 'ครูผู้สอน Inter Plus Consulting', caption: 'ครูผู้สอน', kind: 'teacher' },
  { src: '/experience/experience-02-arm-fixed.png', alt: 'บรรยากาศภายในห้องเรียน', caption: 'บรรยากาศการเรียน', kind: 'classroom' },
  { src: '/experience/experience-08.webp', alt: 'บรรยากาศกิจกรรมกลุ่มของผู้เรียน', caption: 'กิจกรรมของผู้เรียน', kind: 'group' },
  { src: '/experience/experience-05.webp', alt: 'บรรยากาศการเดินทางและกิจกรรมต่างประเทศ', caption: 'ประสบการณ์ต่างประเทศ', kind: 'travel-experience' },
];

function Brand() {
  return <span className="brand"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></span>;
}

export default function Home() {
  return <main><LoadingIntro /><ScrollToTop />
    <header className="site-header"><a href="#top" aria-label="หน้าแรก"><Brand /></a><nav className="desktop-nav" aria-label="เมนูหลัก"><a href="#services">บริการ</a><a href="#about">เกี่ยวกับเรา</a><a href="#process">ขั้นตอน</a></nav><div className="header-actions"><LanguageSwitcher/><a className="button small desktop-consult" href="#contact">ปรึกษาฟรี ↗</a><MobileMenu /></div></header>

    <section className="hero" id="top"><div className="orbit one"/><div className="orbit two"/><div className="hero-copy"><p className="kicker"><i/> INTERNATIONAL EDUCATION & CAREER GUIDANCE</p><h1>เปิดประตูสู่<br/><em>โอกาสใหม่</em><br/>ทั่วโลก</h1><p className="lead">วางแผนการเรียน การทำงาน และการเดินทางต่างประเทศอย่างมั่นใจ ด้วยทีมที่ปรึกษาที่ดูแลคุณทุกขั้นตอน</p><div className="actions"><a className="button" href="#contact">เริ่มวางแผนกับเรา ↗</a><a className="text-link" href="#services">ดูบริการทั้งหมด ↓</a></div><div className="trust"><div><b>10+</b><span>ปีแห่งประสบการณ์</span></div><div><b>4</b><span>บริการหลักครบวงจร</span></div><div><b>1:1</b><span>ดูแลแบบรายบุคคล</span></div></div></div><div className="hero-art"><div className="passport"><small>YOUR NEXT CHAPTER</small><b>GO<br/>BEYOND</b><span>INTER<br/>PLUS</span></div><div className="ticket"><small>FROM THAILAND</small><b>TO THE<br/>WORLD</b></div><div className="note">เรียน • ทำงาน • เดินทาง<br/><b>เรื่องยาก เราช่วยให้ง่าย</b></div></div></section>

    <div className="ticker">เรียนภาษาอังกฤษ　✦　เรียนต่อ UK　✦　ทำงานต่างประเทศ　✦　วีซ่าและการเดินทาง　✦　ทัวร์ส่วนตัว</div>

    <section className="section" id="services"><div className="heading"><div><p className="kicker"><i/> OUR CORE SERVICES</p><h2>ทุกเป้าหมายของคุณ<br/><em>ไปได้ไกลกว่าเดิม</em></h2></div><p>บริการแบบ One-Stop Service ตั้งแต่ค้นหาเส้นทางที่ใช่ เตรียมเอกสาร จนถึงวันที่คุณออกเดินทาง</p></div><ServiceCards /></section>

    <Announcements />

    <section className="learning"><div className="learning-copy"><p className="kicker light"><i/> LEARNING PLUS BY KRU JEW</p><h2>ภาษาอังกฤษ<br/>ที่พาคุณไปถึง<br/><em>เป้าหมายจริง</em></h2><p>เรียนตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ หรือ Hybrid ปรับบทเรียนให้เหมาะกับระดับและเป้าหมายของผู้เรียน</p><a className="button white" href="#contact">สอบถามคอร์สเรียน ↗</a></div><div className="course-list">{[['01','Test Preparation','TOEFL · IELTS · CU-TEP · TU-GET · KEPT'],['02','Academic & Admission','ม.1 / ม.4 · TCAS · NETSAT · TGAT · A-Level'],['03','Global Readiness','เตรียมภาษาเพื่อเรียนต่อและทำงานต่างประเทศ'],['04','Thai for Foreigners','คอร์สภาษาไทยสำหรับชาวต่างชาติ']].map(c=><article className="course" key={c[0]}><b>{c[0]}</b><div><h3>{c[1]}</h3><p>{c[2]}</p></div></article>)}</div></section>

    <section className="section uk"><div className="uk-panel"><div className="uk-art"><img src="/the-uk-enhanced.webp" alt="ธงสหราชอาณาจักรและหอนาฬิกาบิ๊กเบน" /></div><div className="uk-copy"><p className="eyebrow">SUMMER UK COURSE</p><h2>เรียนภาษาอังกฤษ<br/>พร้อมใช้ชีวิตจริง<br/>ที่ Cambridge</h2><p>สัมผัสบรรยากาศเมืองมหาวิทยาลัยชั้นนำ เรียนภาษา ทำกิจกรรม และพักกับ Host Family อย่างปลอดภัย</p><div><span>2-3 สัปดาห์</span><span>เรียน 30 ชั่วโมง</span><span>Certificate</span></div></div></div><blockquote>“เราไม่ได้พาไปแค่เรียนภาษา แต่พาไปค้นพบความมั่นใจและโลกใบใหม่”</blockquote></section>

    <section className="section pathways"><div className="heading"><div><p className="kicker"><i/> WORK & TRAVEL ABROAD</p><h2>เลือกเส้นทางที่เหมาะ<br/>กับจังหวะชีวิตคุณ</h2></div></div><WorkPathways /></section>

    <section className="section process" id="process"><div className="heading"><div><p className="kicker light"><i/> SIMPLE PROCESS</p><h2>4 ขั้นตอน<br/>สู่เป้าหมายของคุณ</h2></div><p>เรื่องต่างประเทศไม่จำเป็นต้องซับซ้อน เมื่อมีคนที่เข้าใจคอยเดินไปกับคุณ</p></div><div className="steps">{steps.map(s=><article key={s[0]}><b>{s[0]}</b><h3>{s[1]}</h3><p>{s[2]}</p></article>)}</div></section>

    <section className="section about" id="about"><div className="about-art"><img src="/about-consultation.webp" alt="ที่ปรึกษา Inter Plus กำลังวางแผนการศึกษาต่อต่างประเทศกับผู้เรียน" /></div><div className="about-copy"><p className="kicker"><i/> WHY INTER PLUS</p><h2>คำแนะนำที่ดี<br/>เปลี่ยนอนาคตได้</h2><p>Inter Plus Consulting เชื่อว่าทุกคนมีเส้นทางที่เหมาะกับตัวเอง เราจึงเริ่มจากการฟัง ทำความเข้าใจ และวางแผนอย่างตรงจุด ไม่ขายฝัน แต่ช่วยให้คุณเห็นทางเลือกที่เป็นไปได้จริง</p><ul><li>ทีมงานมีประสบการณ์และเข้าใจระบบต่างประเทศ</li><li>ดูแลครบตั้งแต่เลือกโปรแกรมจนถึงวันเดินทาง</li><li>ให้คำปรึกษาอย่างจริงใจและเหมาะกับแต่ละบุคคล</li></ul></div></section>

    <section className="partners"><p className="kicker center"><i/> OUR EDUCATION NETWORK</p><h2>สถาบันที่ร่วมงานกับเรา</h2><div className="partner-strip"><div className="partner-static"><div className="partner-mark learning-plus-mark"><img src="/learning-plus-partner.webp" alt="Learning Plus By Kru Jew" /></div><span aria-hidden="true"/><div className="partner-mark stafford-mark"><img src="/stafford-house-partner.webp" alt="Stafford House Study Holidays" /></div></div></div></section>

    <section className="section experience-gallery"><div className="gallery-heading"><div><p className="kicker"><i/> OUR GALLERY</p><h2>ภาพบรรยากาศ</h2></div><p>บรรยากาศการเรียนและกิจกรรมที่ช่วยเปิดโลกใหม่ให้ผู้เรียนของเรา</p></div><ExperienceGallery photos={experiencePhotos}/></section>

    <section className="travel"><div><p className="kicker light"><i/> TRAVEL WITH CONFIDENCE</p><h2>พร้อมออกเดินทาง<br/>แบบไม่ต้องกังวล?</h2></div><div><span>วีซ่าทุกประเภท</span><span>ตั๋วเครื่องบิน</span><span>Private Tour</span><span>Transport & Guide</span></div></section>

    <section className="section contact" id="contact"><div className="contact-intro"><p className="kicker"><i/> LET&apos;S TALK</p><h2>เริ่มต้นบทใหม่<br/>ของคุณวันนี้</h2><p>บอกเราว่าคุณสนใจอะไร ทีมที่ปรึกษาจะติดต่อกลับเพื่อช่วยวางแผนเบื้องต้นโดยไม่มีค่าใช้จ่าย</p><div className="details"><a href="tel:0981045788"><span>โทรศัพท์ • ครูจิว</span><strong>098-104-5788</strong><b>โทรออก ↗</b></a><a href="tel:0910179300"><span>โทรศัพท์ • พี่ลิต้า</span><strong>091-017-9300</strong><b>โทรออก ↗</b></a><a href="mailto:jewellyji1234@gmail.com"><span>อีเมล</span><strong>jewellyji1234@gmail.com</strong><b>ส่งอีเมล ↗</b></a></div><div className="social-contacts"><LineContact/><a className="facebook-contact" href="https://www.facebook.com/englishtutot/" target="_blank" rel="noreferrer"><span>FACEBOOK</span>ติดตามบน Facebook <b>↗</b></a></div></div><ContactForm /><div className="contact-map"><div><p className="kicker"><i/> VISIT US</p><h3>แผนที่และที่ตั้ง</h3><p>Learning Plus By Kru Jew เลขที่ 130 ซอย 1 ตำบลสำราญ อำเภอเมืองยโสธร จังหวัดยโสธร 35000</p><a href="https://maps.app.goo.gl/E2rDNDmPYyJnz4Eo7?g_st=com.hammerandchisel.discord.Share" target="_blank" rel="noreferrer">เปิดใน Google Maps ↗</a></div><iframe src="https://www.google.com/maps?q=Learning+Plus+By+Kru+Jew+130+Soi+1+%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5+%E0%B8%AA%E0%B8%B3%E0%B8%A3%E0%B8%B2%E0%B8%8D+%E0%B8%AD%E0%B8%B3%E0%B9%80%E0%B8%A0%E0%B8%AD%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%A2%E0%B9%82%E0%B8%AA%E0%B8%98%E0%B8%A3+%E0%B8%A2%E0%B9%82%E0%B8%AA%E0%B8%98%E0%B8%A3+35000&amp;output=embed" title="แผนที่ Learning Plus By Kru Jew / Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div></section>

    <footer><Brand/><p>International Education & Career Guidance Center</p><div><a href="#services">บริการ</a><a href="#about">เกี่ยวกับเรา</a><a href="#contact">ติดต่อเรา</a></div><small>© 2026 Inter Plus Consulting. All rights reserved.</small></footer>
  </main>;
}
