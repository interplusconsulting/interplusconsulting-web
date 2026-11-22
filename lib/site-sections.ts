/** Parts of the public website an admin can show or hide (Admin → ตั้งค่าการแสดงหน้าเว็บ). */

export type SectionKey =
  | 'services' | 'announcements' | 'announcement_popup' | 'online_courses' | 'online_exams' | 'about' | 'process'
  | 'gallery' | 'reviews' | 'faq' | 'map' | 'blog' | 'floating';

export type SectionInfo = { key: SectionKey; label: string; hint: string; group: 'home' | 'site' };

export const siteSections: readonly SectionInfo[] = [
  { key: 'services', label: 'บริการของเรา', hint: 'การ์ดบริการ 4 ด้าน และเมนู “บริการ”', group: 'home' },
  { key: 'announcements', label: 'ข่าวสารและประกาศ', hint: 'แถบประกาศแบบเลื่อน', group: 'home' },
  { key: 'announcement_popup', label: 'ป๊อปอัปประกาศ', hint: 'เด้งขึ้นวันละครั้งเมื่อเข้าเว็บ', group: 'home' },
  { key: 'online_courses', label: 'คอร์สออนไลน์', hint: 'การ์ดคอร์สเรียนบนหน้าแรก', group: 'home' },
  { key: 'online_exams', label: 'ข้อสอบออนไลน์', hint: 'รายการข้อสอบเสมือนจริงบนหน้าแรก', group: 'home' },
  { key: 'about', label: 'เกี่ยวกับเรา', hint: 'ส่วน “คำแนะนำที่ดีเปลี่ยนอนาคตได้” และเมนู “เกี่ยวกับเรา”', group: 'home' },
  { key: 'process', label: '4 ขั้นตอน', hint: 'ส่วนขั้นตอนการทำงาน และเมนู “ขั้นตอน”', group: 'home' },
  { key: 'gallery', label: 'ภาพบรรยากาศ', hint: 'แกลเลอรีรูป 6 รูป', group: 'home' },
  { key: 'reviews', label: 'รีวิวลูกค้า', hint: 'แสดงเมื่อมีรีวิว 5 ดาวในระบบ', group: 'home' },
  { key: 'faq', label: 'คำถามที่พบบ่อย', hint: 'ส่วน FAQ และเมนู “คำถามที่พบบ่อย”', group: 'home' },
  { key: 'map', label: 'แผนที่และที่ตั้ง', hint: 'แผนที่ Google ใต้ฟอร์มติดต่อ', group: 'home' },
  { key: 'blog', label: 'เมนูบทความ', hint: 'ลิงก์ “บทความ” ในเมนูด้านบนและท้ายเว็บ', group: 'site' },
  { key: 'floating', label: 'ปุ่มติดต่อลอย', hint: 'ปุ่ม “ปรึกษาฟรี” และ LINE ที่มุมจอ', group: 'site' },
];

const sectionKeys = new Set<string>(siteSections.map(section => section.key));

/** Preserve the old combined off setting when reading existing data. */
export function cleanHidden(value: unknown): SectionKey[] {
  if (!Array.isArray(value)) return [];
  const hidden = new Set<SectionKey>();
  for (const key of value) {
    if (key === 'courses') {
      hidden.add('online_courses');
      hidden.add('online_exams');
    } else if (typeof key === 'string' && sectionKeys.has(key)) {
      hidden.add(key as SectionKey);
    }
  }
  return [...hidden];
}

/** Which setting controls a menu link, e.g. "/#faq" → faq. */
const linkSection: Record<string, SectionKey> = {
  '/#services': 'services', '/#about': 'about', '/#process': 'process', '/#faq': 'faq', '/blog': 'blog',
};

export function isLinkVisible(href: string, hidden: readonly string[]): boolean {
  const key = linkSection[href];
  return !key || !hidden.includes(key);
}
