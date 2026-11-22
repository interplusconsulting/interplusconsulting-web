import Link from 'next/link';
import { services } from '../lib/site';

/** One click per card: each card opens that service's detail page. */
export default function ServiceCards() {
  return <>
    <div className="service-grid">{services.map((service, index) => <Link className="service-card" href={`/services/${service.slug}`} key={service.slug}>
      <div className="service-card-top"><span className="service-icon"><img src={service.icon} alt="" /></span><small>0{index + 1}</small></div>
      <span className="service-label">{service.label}</span>
      <h3>{service.title}</h3>
      <p>{service.text}</p>
      <span className="service-more">ดูรายละเอียด <b aria-hidden="true">→</b></span>
    </Link>)}</div>
    <Link className="extra-services" href="/services/travel#other-services">
      <span className="extra-label">บริการเสริม</span>
      <span>แปลและรับรองเอกสาร · ประกันการเดินทาง · จองที่พักและหอพักนักเรียน</span>
      <b aria-hidden="true">→</b>
    </Link>
  </>;
}
