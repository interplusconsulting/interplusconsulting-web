import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';
import './intro-polish.css';
import './responsive-fixes.css';
import './more-services.css';
import './site-polish.css';
import './portal.css';
import { AuthProvider } from '../lib/auth';
import { contact } from '../lib/site';

/** Site-wide font, self-hosted by Next at build time. CSS uses it through var(--font-sarabun). */
const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sarabun',
});

const siteUrl ='https://interplusconsulting-web.netlify.app';
const siteTitle = 'Inter Plus Consulting | เรียน ทำงาน และเดินทางต่างประเทศ';
const siteDescription = 'ที่ปรึกษาด้านการศึกษา การทำงาน และการเดินทางต่างประเทศ ดูแลครบทุกขั้นตอน';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: '/' },
  verification: { google: 'Pqklg76BiL2lNeC8Ksme0RBOEo9Qx8lyk-nWkpHXDk4' },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: '/',
    siteName: 'Inter Plus Consulting',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Inter Plus Consulting — เรียน ทำงาน และเดินทางต่างประเทศ' }],
  },
  twitter: { card: 'summary_large_image', title: siteTitle, description: siteDescription, images: ['/og-image.jpg'] },
};

const businessData = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Inter Plus Consulting',
  alternateName: 'Learning Plus By Kru Jew',
  url: siteUrl,
  logo: `${siteUrl}/inter-plus-logo-transparent.webp`,
  image: `${siteUrl}/og-image.jpg`,
  description: siteDescription,
  email: contact.email,
  telephone: `+66${contact.phones[0].tel.slice(1)}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'เลขที่ 130 ซอย 1 ตำบลสำราญ',
    addressLocality: 'อำเภอเมืองยโสธร',
    addressRegion: 'ยโสธร',
    postalCode: '35000',
    addressCountry: 'TH',
  },
  hasMap: contact.mapLink,
  sameAs: [contact.facebook],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th" className={sarabun.variable}><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData).replace(/</g, '\\u003c') }} />
    <AuthProvider>{children}</AuthProvider>
  </body></html>;
}
