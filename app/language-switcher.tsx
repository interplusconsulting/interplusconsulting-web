'use client';

import { useEffect, useState } from 'react';

const thToEn: Record<string, string> = {
  'บริการ':'Services','เกี่ยวกับเรา':'About us','ขั้นตอน':'Process','ปรึกษาฟรี':'Free consultation','ปรึกษาฟรี ↗':'Free consultation ↗',
  'เปิดประตูสู่':'Open the door to','โอกาสใหม่':'new opportunities','ทั่วโลก':'around the world',
  'วางแผนการเรียน การทำงาน และการเดินทางต่างประเทศอย่างมั่นใจ ด้วยทีมที่ปรึกษาที่ดูแลคุณทุกขั้นตอน':'Plan your study, career and international journey with confidence, supported by advisors at every step.',
  'เริ่มวางแผนกับเรา ↗':'Start planning with us ↗','ดูบริการทั้งหมด ↓':'Explore all services ↓','ปีแห่งประสบการณ์':'years of experience','บริการหลักครบวงจร':'complete core services','ดูแลแบบรายบุคคล':'personal guidance',
  'เรื่องยาก เราช่วยให้ง่าย':'We make complex journeys simple','เรียนภาษาอังกฤษ　✦　เรียนต่อ UK　✦　ทำงานต่างประเทศ　✦　วีซ่าและการเดินทาง　✦　ทัวร์ส่วนตัว':'English courses　✦　Study in the UK　✦　Work abroad　✦　Travel & visas　✦　Private tours','ม.1 / ม.4 · TCAS · NETSAT · TGAT · A-Level':'Grade 7 / Grade 10 · TCAS · NETSAT · TGAT · A-Level',
  'เรียนภาษาอังกฤษ':'English courses','เรียนต่อประเทศอังกฤษ':'Study in the UK','ทำงานต่างประเทศ':'Work abroad','ท่องเที่ยวและวีซ่า':'Travel & visa',
  'ทุกเป้าหมายของคุณ':'Every goal can','ไปได้ไกลกว่าเดิม':'go further','บริการแบบ One-Stop Service ตั้งแต่ค้นหาเส้นทางที่ใช่ เตรียมเอกสาร จนถึงวันที่คุณออกเดินทาง':'One-stop support from finding the right path and preparing documents to your departure day.',
  'Beginner ถึง Advanced พร้อมคอร์ส IELTS, TOEFL, CU-TEP, TU-GET, KEP และ TCAS':'Beginner to Advanced, including IELTS, TOEFL, CU-TEP, TU-GET, KEP and TCAS preparation.',
  'Summer Course และหลักสูตรระยะสั้น-ยาว ตั้งแต่ 1 เดือนถึง 1 ปี':'Summer courses and short- to long-term programs from one month to one year.',
  'Seasonal Work, Work & Travel และโอกาสทำงานสำหรับผู้มีทักษะ':'Seasonal Work, Work & Travel and skilled employment opportunities.',
  'วางแผนการเดินทาง วีซ่า ตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์':'Travel planning, visas, flights, private tours and guide services.','ดูรายละเอียด':'Learn more',
  'ภาษาอังกฤษ':'English that','ที่พาคุณไปถึง':'takes you to','เป้าหมายจริง':'your real goal','เรียนตัวต่อตัว กลุ่มเล็ก ออนไลน์ ออนไซต์ หรือ Hybrid ปรับบทเรียนให้เหมาะกับระดับและเป้าหมายของผู้เรียน':'Private, small-group, online, on-site or hybrid classes tailored to each learner’s level and goal.','สอบถามคอร์สเรียน ↗':'Ask about courses ↗',
  'เตรียมภาษาเพื่อเรียนต่อและทำงานต่างประเทศ':'English preparation for overseas study and work','คอร์สภาษาไทยสำหรับชาวต่างชาติ':'Thai courses for international learners',
  'พร้อมใช้ชีวิตจริง':'and experience life','ที่ Cambridge':'in Cambridge','สัมผัสบรรยากาศเมืองมหาวิทยาลัยชั้นนำ เรียนภาษา ทำกิจกรรม และพักกับ Host Family อย่างปลอดภัย':'Study in a world-class university city, join activities and stay safely with a host family.','2-3 สัปดาห์':'2-3 weeks','เรียน 30 ชั่วโมง':'30 study hours',
  '“เราไม่ได้พาไปแค่เรียนภาษา แต่พาไปค้นพบความมั่นใจและโลกใบใหม่”':'“We do more than teach English — we help you discover confidence and a new world.”',
  'เลือกเส้นทางที่เหมาะ':'Choose the path that fits','กับจังหวะชีวิตคุณ':'your stage of life','3-6 เดือน':'3-6 months','6 เดือน - 1 ปี':'6 months - 1 year','1-2 ปี':'1-2 years',
  'โครงการทำงานตามฤดูกาล เปิดประสบการณ์ใหม่ในระยะเวลาที่พอดี':'Seasonal work that opens new experiences within a practical timeframe.','ทำงานและท่องเที่ยวต่างประเทศ พร้อมเติบโตทั้งทักษะและมุมมอง':'Work and travel abroad while growing your skills and perspective.','โอกาสระยะยาวสำหรับผู้มีทักษะ พร้อมคำแนะนำด้านเอกสารและสัญญา':'Long-term opportunities for skilled workers, with document and contract guidance.',
  'เลือกแล้ว ✓':'Selected ✓','เลือกโปรแกรมนี้':'Select this program','สนใจโปรแกรมนี้':'I’m interested',
  '4 ขั้นตอน':'4 simple steps','สู่เป้าหมายของคุณ':'to your goal','เรื่องต่างประเทศไม่จำเป็นต้องซับซ้อน เมื่อมีคนที่เข้าใจคอยเดินไปกับคุณ':'Going abroad does not have to be complicated when the right team is beside you.',
  'คุยกับที่ปรึกษา':'Talk to an advisor','เล่าเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ':'Share your goals, budget and preferred timing.','ออกแบบแผนเฉพาะคุณ':'Build your personal plan','ทีมงานคัดหลักสูตร โปรแกรม หรือเส้นทางที่เหมาะสม':'We select the right course, program or pathway.','เตรียมเอกสาร':'Prepare documents','ดูแลใบสมัคร วีซ่า เอกสารรับรอง และการจองต่าง ๆ':'We handle applications, visas, supporting documents and bookings.','เดินทางอย่างมั่นใจ':'Travel with confidence','มีทีมงานประสานงานและให้คำแนะนำตลอดทริป':'Our team coordinates and supports you throughout the journey.',
  'คำแนะนำที่ดี':'The right guidance','เปลี่ยนอนาคตได้':'can change your future','Inter Plus Consulting เชื่อว่าทุกคนมีเส้นทางที่เหมาะกับตัวเอง เราจึงเริ่มจากการฟัง ทำความเข้าใจ และวางแผนอย่างตรงจุด ไม่ขายฝัน แต่ช่วยให้คุณเห็นทางเลือกที่เป็นไปได้จริง':'Inter Plus Consulting believes everyone has a path that suits them. We listen, understand and create realistic plans that turn possibilities into action.',
  'ทีมงานมีประสบการณ์และเข้าใจระบบต่างประเทศ':'Experienced team with international-system knowledge','ดูแลครบตั้งแต่เลือกโปรแกรมจนถึงวันเดินทาง':'Complete support from program selection to departure','ให้คำปรึกษาอย่างจริงใจและเหมาะกับแต่ละบุคคล':'Honest, personal and practical advice',
  'สถาบันที่ร่วมงานกับเรา':'Institutions we work with',
  'ภาพบรรยากาศ':'Our atmosphere','บรรยากาศการเรียนและกิจกรรมที่ช่วยเปิดโลกใหม่ให้ผู้เรียนของเรา':'Learning and activity moments that open new worlds for our students.','ครูผู้สอน':'Our teacher','บรรยากาศการเรียน':'Learning atmosphere','กิจกรรมของผู้เรียน':'Student activities','ประสบการณ์ต่างประเทศ':'Overseas experience','ขยาย ↗':'Enlarge ↗',
  'พร้อมออกเดินทาง':'Ready to travel','แบบไม่ต้องกังวล?':'without the worry?','วีซ่าทุกประเภท':'All visa types','ตั๋วเครื่องบิน':'Flight booking','ทัวร์ส่วนตัว':'Private tours',
  'เริ่มต้นบทใหม่':'Start your next','ของคุณวันนี้':'chapter today','บอกเราว่าคุณสนใจอะไร ทีมที่ปรึกษาจะติดต่อกลับเพื่อช่วยวางแผนเบื้องต้นโดยไม่มีค่าใช้จ่าย':'Tell us what interests you. An advisor will contact you for a free initial consultation.','ครูจิว':'Kru Jew','พี่ลิต้า':'P’Lita',
  'ชื่อ-นามสกุล':'Full name','เบอร์โทร':'Phone number','อีเมล':'Email','บริการที่สนใจ':'Service of interest','เลือกบริการ':'Choose a service','แผนที่คุณให้ความสนใจ':'Plan you are interested in','ส่งข้อมูลให้ที่ปรึกษา ↗':'Send to an advisor ↗','ติดต่อเรา':'Contact us','โทรศัพท์ • ครูจิว':'Phone • Kru Jew','โทรศัพท์ • พี่ลิต้า':'Phone • P’Lita','โทรออก ↗':'Call ↗','ส่งอีเมล ↗':'Send email ↗','ติดต่อผ่าน LINE':'Contact us on LINE','ติดตามบน Facebook':'Follow us on Facebook','แผนที่และที่ตั้ง':'Map & location','Learning Plus By Kru Jew เลขที่ 130 ซอย 1 ตำบลสำราญ อำเภอเมืองยโสธร จังหวัดยโสธร 35000':'Learning Plus By Kru Jew, 130 Soi 1, Samran, Mueang Yasothon, Yasothon 35000','เปิดใน Google Maps ↗':'Open in Google Maps ↗',
};

const placeholders: Record<string, string> = {'กรอกชื่อของคุณ':'Enter your name','08x-xxx-xxxx':'Phone number','you@email.com':'you@email.com','อยากไปประเทศไหน หรือมีคำถามอะไรเพิ่มเติม':'Which country interests you, or what would you like to ask?'};
const enToTh = Object.fromEntries(Object.entries(thToEn).map(([th,en]) => [en, th]));
const placeholderBack = Object.fromEntries(Object.entries(placeholders).map(([th,en]) => [en, th]));

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<'th'|'en'>('th');

  useEffect(() => {
    document.documentElement.lang = language;
    const dictionary = language === 'en' ? thToEn : enToTh;
    const translateNode = (node: Node) => {
      const value = node.nodeValue ?? '';
      const clean = value.trim();
      if (dictionary[clean]) node.nodeValue = value.replace(clean, dictionary[clean]);
    };
    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return translateNode(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) { translateNode(node); node = walker.nextNode(); }
    };
    translateTree(document.body);
    let observer: MutationObserver | undefined;
    if (language === 'en') {
      observer = new MutationObserver((mutations) => mutations.forEach(mutation => {
        if (mutation.type === 'characterData') translateNode(mutation.target);
        mutation.addedNodes.forEach(translateTree);
      }));
      observer.observe(document.body, { subtree:true, childList:true, characterData:true });
    }
    const attrs = language === 'en' ? placeholders : placeholderBack;
    document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('[placeholder]').forEach(el => {
      if (attrs[el.placeholder]) el.placeholder = attrs[el.placeholder];
    });
    return () => observer?.disconnect();
  }, [language]);

  return <div className="language-switcher" aria-label="เลือกภาษา"><button className={language==='th'?'active':''} onClick={()=>setLanguage('th')} type="button">TH</button><span>/</span><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')} type="button">EN</button></div>;
}
