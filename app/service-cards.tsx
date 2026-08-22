'use client';

const services = [
  { icon: 'A+', label: 'LEARNING PLUS', title: 'เรียนภาษาอังกฤษ', text: 'Beginner ถึง Advanced พร้อมคอร์ส IELTS, TOEFL, CU-TEP, TU-GET, KEP และ TCAS' },
  { icon: 'UK', label: 'STUDY IN UK', title: 'เรียนต่อประเทศอังกฤษ', text: 'Summer Course และหลักสูตรระยะสั้น-ยาว ตั้งแต่ 1 เดือนถึง 1 ปี' },
  { icon: 'W', label: 'WORK ABROAD', title: 'ทำงานต่างประเทศ', text: 'Seasonal Work, Work & Travel และโอกาสทำงานสำหรับผู้มีทักษะ' },
  { icon: '✈', label: 'TRAVEL & VISA', title: 'ท่องเที่ยวและวีซ่า', text: 'วางแผนการเดินทาง วีซ่า ตั๋วเครื่องบิน ทัวร์ส่วนตัว และไกด์' },
];

export default function ServiceCards() {
  const selectService = (service: (typeof services)[number]) => {
    window.dispatchEvent(new CustomEvent('interplus:program-selected', {
      detail: {
        service: service.title,
        message: `สนใจบริการ ${service.title}\nรายละเอียด: ${service.text}`,
      },
    }));
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <div className="service-grid">{services.map((service, index) =>
    <button className="service-card" type="button" key={service.title} onClick={() => selectService(service)}>
      <div><span className="service-icon">{service.icon}</span><small>0{index + 1}</small></div>
      <label>{service.label}</label>
      <h3>{service.title}</h3>
      <p>{service.text}</p>
      <span className="service-link">ดูรายละเอียด <b>↗</b></span>
    </button>
  )}</div>;
}
