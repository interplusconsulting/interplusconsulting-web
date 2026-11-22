import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Browser Supabase client. Data access is protected by Row Level Security in supabase/schema.sql. */
export function supabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error('ยังไม่ได้ตั้งค่า Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  client ??= createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}

export function errorText(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : String(error);
  // Every message shown to people is Thai; the technical original goes to the browser console for debugging.
  const rules: [RegExp, string][] = [
    [/Invalid login credentials/i, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'],
    [/Email not confirmed/i, 'กรุณายืนยันอีเมลจากลิงก์ที่ส่งไปก่อนเข้าสู่ระบบ'],
    [/User already registered/i, 'อีเมลนี้สมัครสมาชิกแล้ว'],
    [/Password should be at least/i, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'],
    [/New password should be different/i, 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'],
    [/weak password|password is known to be weak/i, 'รหัสผ่านนี้คาดเดาง่ายเกินไป กรุณาตั้งรหัสใหม่'],
    [/orders_one_open_per_course/i, 'คุณมีคำสั่งซื้อคอร์สนี้ที่รอตรวจสอบหรืออนุมัติแล้ว'],
    [/orders_one_open_per_exam/i, 'คุณมีคำสั่งซื้อข้อสอบชุดนี้ที่รอตรวจสอบหรืออนุมัติแล้ว'],
    [/orders_unique_slip_ref/i, 'สลิปใบนี้เคยถูกใช้สั่งซื้อไปแล้ว กรุณาแนบสลิปของการโอนครั้งนี้'],
    [/Item is not available|Course is not available/i, 'รายการนี้ยังไม่เปิดขาย กรุณาติดต่อแอดมิน'],
    [/Not signed in/i, 'กรุณาเข้าสู่ระบบก่อน หรือบัญชีถูกระงับการใช้งาน'],
    [/Only admins can change/i, 'เฉพาะแอดมินเท่านั้นที่แก้ไขข้อมูลนี้ได้'],
    [/Admins only/i, 'เฉพาะแอดมินเท่านั้นที่ทำรายการนี้ได้'],
    [/No access to this lesson/i, 'คุณยังไม่มีสิทธิ์เข้าบทเรียนนี้'],
    [/Order not found/i, 'ไม่พบคำสั่งซื้อนี้'],
    [/duplicate key|already exists/i, 'ข้อมูลนี้มีอยู่ในระบบแล้ว'],
    [/row-level security|permission denied|not authorized|JWT/i, 'คุณไม่มีสิทธิ์ทำรายการนี้ หรือเซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าใหม่'],
    [/violates not-null constraint|violates check constraint|invalid input syntax/i, 'ข้อมูลไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่'],
    [/violates foreign key constraint/i, 'ข้อมูลที่อ้างถึงไม่มีอยู่แล้ว กรุณารีเฟรชหน้าแล้วลองใหม่'],
    [/Payload too large|exceeded the maximum allowed size|entity too large/i, 'ไฟล์มีขนาดใหญ่เกินกำหนด'],
    [/mime type|invalid_mime_type/i, 'ไม่รองรับไฟล์ประเภทนี้'],
    [/rate limit|too many requests/i, 'มีการทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'],
    [/Failed to fetch|NetworkError|network request failed|Load failed/i, 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'],
  ];
  const match = rules.find(([pattern]) => pattern.test(message));
  if (match) return match[1];
  if (message) console.error('[Inter Plus] unexpected error:', message);
  return 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ กรุณาติดต่อแอดมิน';
}

export function formatBaht(value: number): string {
  const amount = Number(value);
  const digits = Number.isInteger(amount) ? 0 : 2; // 1,234 บาท / 1,234.37 บาท
  return `${amount.toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: 2 })} บาท`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function safeFileName(name: string): string {
  const ext = (name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? `.${ext}` : ''}`;
}

export async function uploadPublicImage(file: File, folder: string): Promise<string> {
  const path = `${folder}/${safeFileName(file.name)}`;
  const { error } = await supabase().storage.from('media').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase().storage.from('media').getPublicUrl(path).data.publicUrl;
}
