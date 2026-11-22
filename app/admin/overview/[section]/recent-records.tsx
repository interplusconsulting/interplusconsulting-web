import Link from 'next/link';
import { formatBaht, formatDate, supabase } from '../../../../lib/supabase';
import type { DashboardSection } from '../../../_portal/dashboard-sections';
import PaginatedList from '../../../_portal/paginated-list';

type Section = Exclude<DashboardSection, { slug: 'payments' }>;
type RecentRecord = { id: string; name: string; detail: string; status: string; tone: string; date: string };
export const recentRecordHeaders = ['ชื่อรายการ', 'รายละเอียด', 'สถานะ', 'วันที่เพิ่ม'];

const columns = {
  contacts: 'name, service, status',
  courses: 'title, price, is_published',
  exams: 'title, level, price, is_published',
  posts: 'title, is_published',
  announcements: 'title, label, is_published',
  reviews: 'author_name, rating, is_published',
  users: 'full_name, email, role, is_active',
} satisfies Record<Section['slug'], string>;

export async function loadRecentRecords(section: Section, signal: AbortSignal): Promise<RecentRecord[] | null> {
  try {
    const { data, error } = await supabase().from(section.table).select(`id, created_at, ${columns[section.slug]}`)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100).abortSignal(signal);
    if (error || !data) return null;

    return (data as unknown as Record<string, unknown>[]).map(row => {
      const text = (key: string) => typeof row[key] === 'string' ? row[key] as string : '';
      const price = Number(row.price) > 0 ? formatBaht(Number(row.price)) : 'ฟรี';
      const base = { id: text('id'), date: formatDate(text('created_at')) };
      if (section.slug === 'contacts') {
        const status = text('status');
        return { ...base, name: text('name'), detail: text('service'), status: status === 'new' ? 'ใหม่' : status === 'contacted' ? 'ติดต่อแล้ว' : 'ปิดเรื่อง', tone: status === 'new' ? 'pending' : 'draft' };
      }
      if (section.slug === 'users') {
        const active = row.is_active === true;
        return { ...base, name: text('full_name') || text('email'), detail: row.role === 'admin' ? 'แอดมิน' : 'ผู้เรียน', status: active ? 'ใช้งาน' : 'ระงับ', tone: active ? 'approved' : 'rejected' };
      }
      const details = {
        courses: price,
        exams: [text('level'), Number(row.price) > 0 ? price : ''].filter(Boolean).join(' · '),
        posts: '',
        announcements: text('label'),
        reviews: typeof row.rating === 'number' ? `${row.rating} ดาว` : '',
      };
      const published = row.is_published === true && (section.slug !== 'reviews' || row.rating === 5);
      return {
        ...base, name: text(section.slug === 'reviews' ? 'author_name' : 'title'), detail: details[section.slug],
        status: published ? 'เผยแพร่แล้ว' : 'ยังไม่เผยแพร่', tone: published ? 'approved' : 'draft',
      };
    });
  } catch {
    return null;
  }
}

export function RecentRecords({ section, records }: { section: Section; records?: RecentRecord[] | null }) {
  return <section className="ip-card ip-recent-payments">
    <header className="ip-recent-payments-head">
      <h2>รายการล่าสุด</h2><Link href={section.href}>ดูทั้งหมด</Link>
    </header>
    <PaginatedList items={records ?? []}>{pageItems => <div className="ip-table-wrap">
      <table className="ip-table">
        <thead><tr>{recentRecordHeaders.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{pageItems.map(record => <tr key={record.id}>
          <td data-label={recentRecordHeaders[0]}><strong>{record.name || '—'}</strong></td>
          <td data-label={recentRecordHeaders[1]}>{record.detail || '—'}</td>
          <td data-label={recentRecordHeaders[2]}><span className={`ip-status ${record.tone}`}>{record.status}</span></td>
          <td data-label={recentRecordHeaders[3]}>{record.date}</td>
        </tr>)}</tbody>
      </table>
    </div>}</PaginatedList>
    {!records?.length && <p role="status">{records === null ? 'โหลดรายการล่าสุดไม่สำเร็จ' : records ? 'ยังไม่มีรายการในหมวดนี้' : 'กำลังโหลดรายการ…'}</p>}
  </section>;
}
