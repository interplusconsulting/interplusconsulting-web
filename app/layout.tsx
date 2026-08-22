import type { Metadata } from 'next';
import './globals.css';
import './intro-polish.css';
import './responsive-fixes.css';

export const metadata: Metadata = {
  title: 'Inter Plus Consulting | เรียน ทำงาน และเดินทางต่างประเทศ',
  description: 'ที่ปรึกษาด้านการศึกษา การทำงาน และการเดินทางต่างประเทศ ดูแลครบทุกขั้นตอน',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
