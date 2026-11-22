import ContactForm from '../contact-form';
import LineContact from '../line-contact';
import { contact } from '../../lib/site';

const mapEmbed = 'https://www.google.com/maps?q=Learning+Plus+By+Kru+Jew+130+Soi+1+%E0%B8%95%E0%B8%B3%E0%B8%9A%E0%B8%A5+%E0%B8%AA%E0%B8%B3%E0%B8%A3%E0%B8%B2%E0%B8%8D+%E0%B8%AD%E0%B8%B3%E0%B9%80%E0%B8%A0%E0%B8%AD%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%A2%E0%B9%82%E0%B8%AA%E0%B8%98%E0%B8%A3+%E0%B8%A2%E0%B9%82%E0%B8%AA%E0%B8%98%E0%B8%A3+35000&output=embed';

export default function ContactSection({ showMap = true }: { showMap?: boolean }) {
  return <section className="section contact" id="contact">
    <div className="contact-intro">
      <p className="kicker"><i/> LET&apos;S TALK</p>
      <h2>เริ่มต้นบทใหม่<br/>ของคุณวันนี้</h2>
      <p>บอกเราว่าคุณสนใจอะไร ทีมที่ปรึกษาจะติดต่อกลับเพื่อช่วยวางแผนเบื้องต้นโดยไม่มีค่าใช้จ่าย</p>
      <div className="details">
        {contact.phones.map(phone => <a key={phone.tel} href={`tel:${phone.tel}`}><span>{`โทรศัพท์ • ${phone.label}`}</span><strong>{phone.display}</strong><b>โทรออก ↗</b></a>)}
        <a href={`mailto:${contact.email}`}><span>อีเมล</span><strong>{contact.email}</strong><b>ส่งอีเมล ↗</b></a>
      </div>
      <div className="social-contacts"><LineContact/><a className="facebook-contact" href={contact.facebook} target="_blank" rel="noreferrer"><span>FACEBOOK</span>ติดตามบน Facebook <b>↗</b></a></div>
    </div>
    <ContactForm />
    {showMap && <div className="contact-map">
      <div><p className="kicker"><i/> VISIT US</p><h3>แผนที่และที่ตั้ง</h3><p>{contact.address}</p><a href={contact.mapLink} target="_blank" rel="noreferrer">เปิดใน Google Maps ↗</a></div>
      <iframe src={mapEmbed} title="แผนที่ Learning Plus By Kru Jew / Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    </div>}
  </section>;
}
