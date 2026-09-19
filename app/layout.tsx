import type { Metadata } from 'next';
import './globals.css';
import './intro-polish.css';
import './responsive-fixes.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://interplusconsulting-web.netlify.app'),
  title: 'Inter Plus Consulting | เรียน ทำงาน และเดินทางต่างประเทศ',
  description: 'ที่ปรึกษาด้านการศึกษา การทำงาน และการเดินทางต่างประเทศ ดูแลครบทุกขั้นตอน',
  alternates: { canonical: '/' },
  verification: { google: 'Pqklg76BiL2lNeC8Ksme0RBOEo9Qx8lyk-nWkpHXDk4' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
