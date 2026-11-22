export type Role = 'student' | 'admin';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  /** Original price shown struck through during a promotion (0 = no promotion). */
  compare_at_price: number;
  badge: string;
  cover_url: string;
  is_published: boolean;
  position: number;
  created_at: string;
};

export type QuizQuestion = { question: string; choices: string[] };

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  video_url: string;
  pdf_path: string;
  body: string;
  image_urls: string[];
  quiz: QuizQuestion[];
  quiz_url: string;
};

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export type Order = {
  id: string;
  user_id: string;
  course_id: string | null;
  exam_id: string | null;
  amount: number;
  slip_path: string;
  slip_ref: string;
  status: OrderStatus;
  note: string;
  created_at: string;
  reviewed_at: string | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_url: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type DbAnnouncement = {
  id: string;
  label: string;
  title: string;
  description: string;
  details: string[];
  image_url: string;
  gallery: string[];
  is_published: boolean;
  position: number;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  level: string;
  question_count: number;
  duration_min: number;
  url: string;
  cover_url: string;
  price: number;
  compare_at_price: number;
  badge: string;
  course_id: string | null;
  is_published: boolean;
  position: number;
  created_at: string;
};

/** Row returned by the exam_catalog() database function (url is empty until the member has access). */
export type CatalogExam = {
  id: string;
  title: string;
  description: string;
  level: string;
  question_count: number;
  duration_min: number;
  cover_url: string;
  price: number;
  course_id: string | null;
  course_title: string | null;
  course_price: number | null;
  has_access: boolean;
  pending_order: boolean;
  url: string;
  badge: string;
  compare_at_price: number;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  review_url: string;
  review_date: string;
  source: string;
  is_published: boolean;
  position: number;
  created_at: string;
};

export const orderStatusText: Record<OrderStatus, string> = {
  pending: 'รอตรวจสอบสลิป',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
};
