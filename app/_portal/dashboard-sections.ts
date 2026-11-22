export const dashboardSections = [
  { slug: 'contacts', label: 'ผู้ติดต่อ', icon: 'inbox', table: 'contact_requests', href: '/admin/contacts', metrics: [
    { label: 'ผู้ติดต่อใหม่', filter: ['status', 'new'] },
  ] },
  { slug: 'payments', label: 'การชำระเงิน', icon: 'wallet', table: 'orders', href: '/admin/orders', metrics: [
    { label: 'สลิปรอตรวจสอบ', filter: ['status', 'pending'] },
    { label: 'อนุมัติแล้ว', filter: ['status', 'approved'] },
    { label: 'ปฏิเสธแล้ว', filter: ['status', 'rejected'] },
  ] },
  { slug: 'courses', label: 'คอร์สเรียน', icon: 'book', table: 'courses', href: '/admin/courses' },
  { slug: 'exams', label: 'คลังข้อสอบ', icon: 'clipboard', table: 'exams', href: '/admin/exams' },
  { slug: 'posts', label: 'โพสต์', icon: 'post', table: 'posts', href: '/admin/posts' },
  { slug: 'announcements', label: 'ประกาศ', icon: 'megaphone', table: 'announcements', href: '/admin/announcements' },
  { slug: 'reviews', label: 'รีวิว', icon: 'star', table: 'reviews', href: '/admin/reviews' },
  { slug: 'users', label: 'ผู้ใช้', icon: 'users', table: 'profiles', href: '/admin/users', metrics: [
    { label: 'ผู้เรียนทั้งหมด', filter: ['role', 'student'] },
    { label: 'ผู้ดูแลทั้งหมด', filter: ['role', 'admin'] },
  ] },
] as const;

export type DashboardSection = (typeof dashboardSections)[number];
