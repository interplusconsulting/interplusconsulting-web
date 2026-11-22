/** Contact details and service list shared by the header, footer, contact section and service pages. */
export const contact = {
  phones: [
    { label: 'ครูจิว', display: '098-104-5788', tel: '0981045788' },
    { label: 'พี่ลิต้า', display: '091-017-9300', tel: '0910179300' },
  ],
  email: 'jewellyji1234@gmail.com',
  facebook: 'https://www.facebook.com/englishtutot/',
  line: 'https://line.me/ti/p/cBuPUGY7jm#~',
  address: 'Learning Plus By Kru Jew เลขที่ 130 ซอย 1 ตำบลสำราญ อำเภอเมืองยโสธร จังหวัดยโสธร 35000',
  mapLink: 'https://maps.app.goo.gl/E2rDNDmPYyJnz4Eo7',
};

export type ServiceSlug = 'english' | 'study-uk' | 'work-abroad' | 'travel';

export const services: { slug: ServiceSlug; icon: string; label: string; title: string; text: string; contactService: string }[] = [
  { slug: 'english', icon: '/service-icons/learning.png', label: 'LEARNING PLUS', title: 'เรียนภาษาอังกฤษ', text: 'Beginner ถึง Advanced พร้อมคอร์ส IELTS, TOEFL, CU-TEP, TU-GET, KEPT และ TCAS', contactService: 'เรียนภาษาอังกฤษ' },
  { slug: 'study-uk', icon: '/service-icons/uk.png', label: 'STUDY IN UK', title: 'เรียนต่อประเทศอังกฤษ', text: 'Summer Course และหลักสูตรระยะสั้น-ยาว ตั้งแต่ 1 เดือนถึง 1 ปี', contactService: 'เรียนต่อประเทศอังกฤษ' },
  { slug: 'work-abroad', icon: '/service-icons/work.png', label: 'WORK ABROAD', title: 'ทำงานต่างประเทศ', text: 'Seasonal Work, Work & Travel และโอกาสทำงานสำหรับผู้มีทักษะ', contactService: 'ทำงานต่างประเทศ' },
  { slug: 'travel', icon: '/service-icons/travel.png', label: 'TRAVEL & VISA', title: 'ท่องเที่ยวและวีซ่า', text: 'วางแผนการเดินทาง วีซ่า ตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์', contactService: 'ท่องเที่ยวและวีซ่า' },
];
