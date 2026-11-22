import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { services, type ServiceSlug } from '../../../lib/site';
import ContactSection from '../../_site/contact-section';
import SiteChrome from '../../_site/site-chrome';
import { serviceContent } from '../../_site/service-content';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return services.map(service => ({ slug: service.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find(item => item.slug === slug);
  if (!service) return {};
  return {
    title: `${service.title} | Inter Plus Consulting`,
    description: serviceContent[service.slug].intro,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = services.find(item => item.slug === slug);
  if (!service) notFound();
  const content = serviceContent[service.slug as ServiceSlug];
  const Body = content.body;
  const others = services.filter(item => item.slug !== service.slug);

  return <SiteChrome>
    <section className="page-hero">
      <nav className="breadcrumb" aria-label="ตำแหน่งหน้า"><Link href="/">หน้าแรก</Link><span aria-hidden="true">/</span><Link href="/#services">บริการ</Link><span aria-hidden="true">/</span><span>{service.title}</span></nav>
      <div className="page-hero-inner">
        <span className="page-hero-icon"><img src={service.icon} alt="" /></span>
        <div>
          <p className="kicker"><i/> {content.kicker}</p>
          <h1>{service.title}</h1>
          <p className="lead">{content.intro}</p>
          <div className="actions"><a className="button" href="#contact">ปรึกษาฟรี ↗</a><Link className="text-link" href="/#services">ดูบริการอื่น</Link></div>
        </div>
      </div>
    </section>
    <Body />
    <section className="section other-service-links">
      <p className="kicker"><i/> MORE SERVICES</p>
      <h2 className="section-title">บริการอื่นของเรา</h2>
      <div className="service-link-grid">{others.map(item => <Link key={item.slug} href={`/services/${item.slug}`} className="service-link-card"><img src={item.icon} alt="" /><span><b>{item.title}</b><small>{item.text}</small></span><em aria-hidden="true">→</em></Link>)}</div>
    </section>
    <ContactSection showMap={false} />
  </SiteChrome>;
}
