import Link from 'next/link';
import { contact, services } from '../../lib/site';
import SectionLink from './section-link';
import { isLinkVisible } from '../../lib/site-sections';

export default function SiteFooter({ hidden = [] }: { hidden?: readonly string[] }) {
  return <footer className="site-footer">
    <div className="footer-grid">
      <div className="footer-brand">
        <span className="brand"><img src="/inter-plus-logo-transparent.webp" alt="Inter Plus Consulting" /></span>
        <p>International Education & Career Guidance Center</p>
        <p className="footer-address">{contact.address}</p>
      </div>
      <div>
        <h3>บริการ</h3>
        <ul>{services.map(service => <li key={service.slug}><Link href={`/services/${service.slug}`}>{service.title}</Link></li>)}</ul>
      </div>
      <div>
        <h3>เมนู</h3>
        <ul>
          {isLinkVisible('/#about', hidden) && <li><SectionLink href="/#about">เกี่ยวกับเรา</SectionLink></li>}
          {isLinkVisible('/#faq', hidden) && <li><SectionLink href="/#faq">คำถามที่พบบ่อย</SectionLink></li>}
          {isLinkVisible('/blog', hidden) && <li><Link href="/blog">บทความ</Link></li>}
          <li><Link href="/login">คอร์สออนไลน์ / เข้าสู่ระบบ</Link></li>
        </ul>
      </div>
      <div>
        <h3>ติดต่อเรา</h3>
        <ul>
          {contact.phones.map(phone => <li key={phone.tel}><a href={`tel:${phone.tel}`}>{phone.display}</a> <small>({phone.label})</small></li>)}
          <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
          <li className="footer-social"><a href={contact.line} target="_blank" rel="noreferrer">LINE</a><a href={contact.facebook} target="_blank" rel="noreferrer">Facebook</a><a href={contact.mapLink} target="_blank" rel="noreferrer">แผนที่</a></li>
        </ul>
      </div>
    </div>
    <small className="footer-copy">© 2026 Inter Plus Consulting. All rights reserved.</small>
  </footer>;
}
